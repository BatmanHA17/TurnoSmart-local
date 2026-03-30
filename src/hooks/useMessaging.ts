import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";

export interface ConversationParticipant {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface LastMessage {
  content: string;
  senderName: string;
  createdAt: string;
}

export interface ConversationWithPreview {
  id: string;
  name: string | null;
  type: "direct" | "group";
  lastMessage: LastMessage | null;
  unreadCount: number;
  participants: ConversationParticipant[];
}

export function useMessaging() {
  const { user } = useAuth();
  const { org } = useCurrentOrganization();
  const [conversations, setConversations] = useState<ConversationWithPreview[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    if (!user || !org) {
      setConversations([]);
      setLoading(false);
      return;
    }

    try {
      // Fetch conversations the user participates in for this org
      const { data: convRows, error: convError } = await supabase
        .from("conversations")
        .select("id, name, type, last_message_at, created_by")
        .eq("org_id", org.id)
        .order("last_message_at", { ascending: false });

      if (convError || !convRows) {
        setLoading(false);
        return;
      }

      const convIds = convRows.map((c) => c.id);

      if (convIds.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // Fetch participants for all conversations
      const { data: participantRows } = await supabase
        .from("conversation_participants")
        .select("conversation_id, user_id, last_read_at")
        .in("conversation_id", convIds);

      // Fetch profiles for all participant user_ids
      const allUserIds = [
        ...new Set((participantRows ?? []).map((p) => p.user_id)),
      ];

      const { data: profileRows } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", allUserIds);

      const profileMap = new Map<
        string,
        { full_name: string | null; avatar_url: string | null }
      >();
      (profileRows ?? []).forEach((p) => {
        profileMap.set(p.id, {
          full_name: p.full_name,
          avatar_url: p.avatar_url,
        });
      });

      // Fetch last message per conversation
      const lastMsgPromises = convIds.map((cid) =>
        supabase
          .from("messages")
          .select("id, content, sender_id, created_at")
          .eq("conversation_id", cid)
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .limit(1)
          .then(({ data }) => ({ cid, msg: data?.[0] ?? null }))
      );
      const lastMsgResults = await Promise.all(lastMsgPromises);
      const lastMsgMap = new Map<string, { content: string; sender_id: string; created_at: string } | null>();
      lastMsgResults.forEach(({ cid, msg }) => lastMsgMap.set(cid, msg));

      // Build unread counts per conversation for current user
      const myParticipation = (participantRows ?? []).filter(
        (p) => p.user_id === user.id
      );
      const lastReadMap = new Map<string, string>();
      myParticipation.forEach((p) =>
        lastReadMap.set(p.conversation_id, p.last_read_at)
      );

      const unreadPromises = convIds.map(async (cid) => {
        const lastRead = lastReadMap.get(cid);
        if (!lastRead) return { cid, count: 0 };
        const { count } = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("conversation_id", cid)
          .is("deleted_at", null)
          .neq("sender_id", user.id)
          .gt("created_at", lastRead);
        return { cid, count: count ?? 0 };
      });
      const unreadResults = await Promise.all(unreadPromises);
      const unreadMap = new Map<string, number>();
      unreadResults.forEach(({ cid, count }) => unreadMap.set(cid, count));

      // Build final list
      const built: ConversationWithPreview[] = convRows.map((conv) => {
        const convParticipants = (participantRows ?? [])
          .filter((p) => p.conversation_id === conv.id)
          .map((p) => {
            const profile = profileMap.get(p.user_id);
            return {
              userId: p.user_id,
              displayName: profile?.full_name ?? "Usuario",
              avatarUrl: profile?.avatar_url ?? null,
            };
          });

        const lastMsg = lastMsgMap.get(conv.id);
        let lastMessage: LastMessage | null = null;
        if (lastMsg) {
          const senderProfile = profileMap.get(lastMsg.sender_id);
          lastMessage = {
            content: lastMsg.content,
            senderName: senderProfile?.full_name ?? "Usuario",
            createdAt: lastMsg.created_at,
          };
        }

        // For direct convs with no name, derive name from the other participant
        let displayName = conv.name;
        if (!displayName && conv.type === "direct") {
          const other = convParticipants.find((p) => p.userId !== user.id);
          displayName = other?.displayName ?? "Conversación";
        }

        return {
          id: conv.id,
          name: displayName ?? null,
          type: conv.type as "direct" | "group",
          lastMessage,
          unreadCount: unreadMap.get(conv.id) ?? 0,
          participants: convParticipants,
        };
      });

      setConversations(built);
    } catch (err) {
      console.error("useMessaging fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [user, org]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Realtime: refresh conversation list when a new message arrives
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("messaging:conversations")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchConversations]);

  const createDirectConversation = useCallback(
    async (otherUserId: string): Promise<string> => {
      if (!user || !org) throw new Error("Not authenticated");

      // Check if a direct conversation already exists between these two users in this org
      const { data: existing } = await supabase
        .from("conversation_participants")
        .select("conversation_id, conversations!inner(id, org_id, type)")
        .eq("user_id", user.id);

      if (existing) {
        const myConvIds = existing.map((e) => e.conversation_id);
        if (myConvIds.length > 0) {
          const { data: shared } = await supabase
            .from("conversation_participants")
            .select("conversation_id")
            .eq("user_id", otherUserId)
            .in("conversation_id", myConvIds);

          if (shared && shared.length > 0) {
            // Check if any of these are direct convs in the same org
            for (const s of shared) {
              const conv = (existing as any[]).find(
                (e) => e.conversation_id === s.conversation_id
              );
              if (
                conv?.conversations?.type === "direct" &&
                conv?.conversations?.org_id === org.id
              ) {
                return s.conversation_id;
              }
            }
          }
        }
      }

      // Create new conversation
      const { data: newConv, error: convError } = await supabase
        .from("conversations")
        .insert({
          org_id: org.id,
          type: "direct",
          created_by: user.id,
        })
        .select("id")
        .single();

      if (convError || !newConv) throw convError ?? new Error("Failed to create conversation");

      // Add both participants
      await supabase.from("conversation_participants").insert([
        { conversation_id: newConv.id, user_id: user.id },
        { conversation_id: newConv.id, user_id: otherUserId },
      ]);

      await fetchConversations();
      return newConv.id;
    },
    [user, org, fetchConversations]
  );

  const createGroupConversation = useCallback(
    async (name: string, participantIds: string[]): Promise<string> => {
      if (!user || !org) throw new Error("Not authenticated");

      const { data: newConv, error: convError } = await supabase
        .from("conversations")
        .insert({
          org_id: org.id,
          type: "group",
          name,
          created_by: user.id,
        })
        .select("id")
        .single();

      if (convError || !newConv) throw convError ?? new Error("Failed to create group");

      const allParticipants = [...new Set([user.id, ...participantIds])];
      await supabase.from("conversation_participants").insert(
        allParticipants.map((uid) => ({
          conversation_id: newConv.id,
          user_id: uid,
        }))
      );

      await fetchConversations();
      return newConv.id;
    },
    [user, org, fetchConversations]
  );

  return {
    conversations,
    loading,
    createDirectConversation,
    createGroupConversation,
    refetch: fetchConversations,
  };
}
