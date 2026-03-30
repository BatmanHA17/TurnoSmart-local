import React, { useEffect, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { MessageCircle, Send, Search, Plus, Users, User } from "lucide-react";
import { MainLayout } from "@/components/MainLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMessaging, ConversationWithPreview } from "@/hooks/useMessaging";
import { useConversationMessages } from "@/hooks/useConversationMessages";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { supabase } from "@/integrations/supabase/client";

// ─── New conversation dialog (simple inline) ────────────────────────────────

interface OrgMember {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
}

interface NewConvDialogProps {
  onClose: () => void;
  onCreated: (convId: string) => void;
  createDirect: (otherId: string) => Promise<string>;
  createGroup: (name: string, ids: string[]) => Promise<string>;
  orgId: string | undefined;
  currentUserId: string;
}

function NewConvDialog({
  onClose,
  onCreated,
  createDirect,
  createGroup,
  orgId,
  currentUserId,
}: NewConvDialogProps) {
  const [mode, setMode] = useState<"direct" | "group">("direct");
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!orgId) return;
    supabase
      .from("memberships")
      .select("user_id, profiles!inner(id, full_name, avatar_url)")
      .eq("org_id", orgId)
      .eq("status", "active")
      .neq("user_id", currentUserId)
      .then(({ data }) => {
        if (!data) return;
        const list: OrgMember[] = data.map((m: any) => ({
          userId: m.user_id,
          displayName: m.profiles?.full_name ?? "Usuario",
          avatarUrl: m.profiles?.avatar_url ?? null,
        }));
        setMembers(list);
      });
  }, [orgId, currentUserId]);

  const filtered = members.filter((m) =>
    m.displayName.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelected = (uid: string) => {
    setSelected((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const handleCreate = async () => {
    if (selected.length === 0) return;
    setLoading(true);
    try {
      let convId: string;
      if (mode === "direct" && selected.length === 1) {
        convId = await createDirect(selected[0]);
      } else {
        const name = groupName.trim() || "Grupo";
        convId = await createGroup(name, selected);
      }
      onCreated(convId);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-background border rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">Nueva conversación</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant={mode === "direct" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("direct")}
            className="flex-1"
          >
            <User className="h-4 w-4 mr-1" />
            Directo
          </Button>
          <Button
            variant={mode === "group" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("group")}
            className="flex-1"
          >
            <Users className="h-4 w-4 mr-1" />
            Grupo
          </Button>
        </div>

        {mode === "group" && (
          <Input
            placeholder="Nombre del grupo"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />
        )}

        <Input
          placeholder="Buscar miembros..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <ScrollArea className="h-48 border rounded-md">
          <div className="p-2 space-y-1">
            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No se encontraron miembros
              </p>
            )}
            {filtered.map((m) => (
              <button
                key={m.userId}
                onClick={() => toggleSelected(m.userId)}
                className={`flex items-center gap-3 w-full px-3 py-2 rounded-md text-left transition-colors ${
                  selected.includes(m.userId)
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted"
                }`}
              >
                <Avatar className="h-7 w-7">
                  <AvatarImage src={m.avatarUrl ?? undefined} />
                  <AvatarFallback className="text-xs">
                    {m.displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">{m.displayName}</span>
                {selected.includes(m.userId) && (
                  <span className="ml-auto text-primary text-xs">✓</span>
                )}
              </button>
            ))}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleCreate}
            disabled={selected.length === 0 || loading}
          >
            {loading ? "Creando..." : "Crear"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Conversation list item ─────────────────────────────────────────────────

interface ConvItemProps {
  conv: ConversationWithPreview;
  isActive: boolean;
  currentUserId: string;
  onClick: () => void;
}

function ConvItem({ conv, isActive, currentUserId, onClick }: ConvItemProps) {
  const displayName =
    conv.name ??
    conv.participants.find((p) => p.userId !== currentUserId)?.displayName ??
    "Conversación";

  const avatarUrl =
    conv.type === "direct"
      ? conv.participants.find((p) => p.userId !== currentUserId)?.avatarUrl ?? null
      : null;

  return (
    <button
      onClick={onClick}
      className={`flex items-start gap-3 w-full px-4 py-3 text-left transition-colors border-b border-border/40 ${
        isActive ? "bg-primary/10" : "hover:bg-muted"
      }`}
    >
      <Avatar className="h-10 w-10 shrink-0 mt-0.5">
        <AvatarImage src={avatarUrl ?? undefined} />
        <AvatarFallback>
          {conv.type === "group" ? (
            <Users className="h-5 w-5" />
          ) : (
            displayName.charAt(0).toUpperCase()
          )}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className="font-medium text-sm truncate">{displayName}</span>
          <div className="flex items-center gap-1 shrink-0">
            {conv.lastMessage && (
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDistanceToNow(new Date(conv.lastMessage.createdAt), {
                  addSuffix: false,
                  locale: es,
                })}
              </span>
            )}
            {conv.unreadCount > 0 && (
              <Badge className="h-5 min-w-5 px-1 text-xs rounded-full">
                {conv.unreadCount}
              </Badge>
            )}
          </div>
        </div>
        {conv.lastMessage && (
          <p className="text-xs text-muted-foreground truncate">
            {conv.lastMessage.senderName}: {conv.lastMessage.content}
          </p>
        )}
      </div>
    </button>
  );
}

// ─── Message bubble ─────────────────────────────────────────────────────────

interface BubbleProps {
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  content: string;
  createdAt: string;
  isOwn: boolean;
}

function Bubble({
  senderName,
  senderAvatar,
  content,
  createdAt,
  isOwn,
}: BubbleProps) {
  return (
    <div className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
      {!isOwn && (
        <Avatar className="h-7 w-7 shrink-0 mb-4">
          <AvatarImage src={senderAvatar ?? undefined} />
          <AvatarFallback className="text-xs">
            {senderName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}
      <div className={`max-w-[70%] space-y-1 ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
        <div
          className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
            isOwn
              ? "bg-primary text-primary-foreground rounded-br-sm"
              : "bg-muted rounded-bl-sm"
          }`}
        >
          {content}
        </div>
        <span className="text-[11px] text-muted-foreground px-1">
          {!isOwn && <span className="font-medium">{senderName} · </span>}
          {formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: es })}
        </span>
      </div>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function Mensajes() {
  const { user } = useAuth();
  const { org } = useCurrentOrganization();
  const { conversations, loading: convsLoading, createDirectConversation, createGroupConversation } =
    useMessaging();

  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showNewConv, setShowNewConv] = useState(false);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, loading: msgsLoading, sendMessage, markAsRead } =
    useConversationMessages(activeConvId);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Mark as read when active conversation changes or new messages arrive
  useEffect(() => {
    if (activeConvId) {
      markAsRead();
    }
  }, [activeConvId, messages.length, markAsRead]);

  useEffect(() => {
    document.title = "Mensajes – TurnoSmart";
  }, []);

  const filteredConvs = conversations.filter((c) => {
    const name =
      c.name ??
      c.participants.find((p) => p.userId !== user?.id)?.displayName ??
      "";
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const activeConv = conversations.find((c) => c.id === activeConvId);
  const activeConvName =
    activeConv?.name ??
    activeConv?.participants.find((p) => p.userId !== user?.id)?.displayName ??
    "Conversación";

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const text = inputText;
    setInputText("");
    await sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <MainLayout>
      <div className="flex h-[calc(100vh-64px)] overflow-hidden">
        {/* ── Left panel: conversation list ── */}
        <div className="w-full md:w-80 lg:w-96 border-r border-border flex flex-col shrink-0">
          {/* Header */}
          <div className="p-4 border-b border-border space-y-3">
            <div className="flex items-center justify-between">
              <h1 className="font-semibold text-lg flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                Mensajes
              </h1>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowNewConv(true)}
                className="gap-1"
              >
                <Plus className="h-4 w-4" />
                Nueva
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar conversación..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Conversation list */}
          <ScrollArea className="flex-1">
            {convsLoading && (
              <div className="p-6 text-center text-sm text-muted-foreground">
                Cargando conversaciones...
              </div>
            )}
            {!convsLoading && filteredConvs.length === 0 && (
              <div className="p-6 text-center text-sm text-muted-foreground space-y-2">
                <MessageCircle className="h-8 w-8 mx-auto text-muted-foreground/40" />
                <p>Sin conversaciones aún.</p>
                <p>Pulsa "Nueva" para empezar.</p>
              </div>
            )}
            {filteredConvs.map((conv) => (
              <ConvItem
                key={conv.id}
                conv={conv}
                isActive={conv.id === activeConvId}
                currentUserId={user?.id ?? ""}
                onClick={() => setActiveConvId(conv.id)}
              />
            ))}
          </ScrollArea>
        </div>

        {/* ── Right panel: message thread ── */}
        <div
          className={`flex-1 flex flex-col ${
            activeConvId ? "flex" : "hidden md:flex"
          }`}
        >
          {!activeConvId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
              <MessageCircle className="h-12 w-12 opacity-30" />
              <p className="text-sm">Selecciona una conversación para empezar</p>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div className="px-5 py-3 border-b border-border flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  {activeConv?.type === "direct" ? (
                    <>
                      <AvatarImage
                        src={
                          activeConv?.participants.find(
                            (p) => p.userId !== user?.id
                          )?.avatarUrl ?? undefined
                        }
                      />
                      <AvatarFallback>
                        {activeConvName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </>
                  ) : (
                    <AvatarFallback>
                      <Users className="h-4 w-4" />
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <p className="font-medium text-sm">{activeConvName}</p>
                  {activeConv && (
                    <p className="text-xs text-muted-foreground">
                      {activeConv.participants.length === 1
                        ? "1 participante"
                        : `${activeConv.participants.length} participantes`}
                      {activeConv.type === "group" && " · Grupo"}
                    </p>
                  )}
                </div>
              </div>

              {/* Messages list */}
              <ScrollArea className="flex-1 px-5 py-4">
                {msgsLoading && (
                  <p className="text-center text-sm text-muted-foreground py-4">
                    Cargando mensajes...
                  </p>
                )}
                {!msgsLoading && messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2 py-12">
                    <MessageCircle className="h-8 w-8 opacity-30" />
                    <p className="text-sm">Sin mensajes aún. ¡Sé el primero!</p>
                  </div>
                )}
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <Bubble
                      key={msg.id}
                      senderId={msg.senderId}
                      senderName={msg.senderName}
                      senderAvatar={msg.senderAvatar}
                      content={msg.content}
                      createdAt={msg.createdAt}
                      isOwn={msg.senderId === user?.id}
                    />
                  ))}
                </div>
                <div ref={messagesEndRef} />
              </ScrollArea>

              {/* Input bar */}
              <div className="px-5 py-3 border-t border-border flex items-center gap-2">
                <Input
                  placeholder="Escribe un mensaje..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1"
                />
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={!inputText.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* New conversation dialog */}
      {showNewConv && (
        <NewConvDialog
          onClose={() => setShowNewConv(false)}
          onCreated={(convId) => {
            setActiveConvId(convId);
            setShowNewConv(false);
          }}
          createDirect={createDirectConversation}
          createGroup={createGroupConversation}
          orgId={org?.id}
          currentUserId={user?.id ?? ""}
        />
      )}
    </MainLayout>
  );
}
