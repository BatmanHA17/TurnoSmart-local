import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  content: string;
  type: "text" | "image" | "file" | "system";
  editedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
}

export function useConversationMessages(conversationId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!conversationId || !user) {
      setMessages([]);
      return;
    }

    setLoading(true);
    try {
      const { data: rows, error } = await supabase
        .from("messages")
        .select("id, conversation_id, sender_id, content, type, edited_at, deleted_at, created_at")
        .eq("conversation_id", conversationId)
        .is("deleted_at", null)
        .order("created_at", { ascending: true });

      if (error || !rows) {
        setLoading(false);
        return;
      }

      const senderIds = [...new Set(rows.map((r) => r.sender_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", senderIds);

      const profileMap = new Map<string, { full_name: string | null; avatar_url: string | null }>();
      (profiles ?? []).forEach((p) => profileMap.set(p.id, p));

      const built: Message[] = rows.map((r) => {
        const profile = profileMap.get(r.sender_id);
        return {
          id: r.id,
          conversationId: r.conversation_id,
          senderId: r.sender_id,
          senderName: profile?.full_name ?? "Usuario",
          senderAvatar: profile?.avatar_url ?? null,
          content: r.content,
          type: r.type as Message["type"],
          editedAt: r.edited_at,
          deletedAt: r.deleted_at,
          createdAt: r.created_at,
        };
      });

      setMessages(built);
    } finally {
      setLoading(false);
    }
  }, [conversationId, user]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Realtime subscription for live updates
  useEffect(() => {
    if (!conversationId || !user) return;

    // Clean up previous channel if any
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [conversationId, user, fetchMessages]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!conversationId || !user || !content.trim()) return;

      const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: content.trim(),
        type: "text",
      });

      if (!error) {
        // Update last_message_at on the conversation
        await supabase
          .from("conversations")
          .update({ last_message_at: new Date().toISOString() })
          .eq("id", conversationId);
      }
    },
    [conversationId, user]
  );

  const markAsRead = useCallback(async () => {
    if (!conversationId || !user) return;

    await supabase
      .from("conversation_participants")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id);
  }, [conversationId, user]);

  return { messages, loading, sendMessage, markAsRead };
}
