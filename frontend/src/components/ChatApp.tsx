"use client";

import { ChevronDown } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { AuthModal } from "@/components/AuthModal";
import { ChatInput, ChatMessage, TypingIndicator } from "@/components/Chat";
import { Sidebar } from "@/components/Sidebar";
import { api, getToken, type Conversation, type Message } from "@/lib/api";
import { useAuth } from "@/lib/useAuth";

const GREETINGS = [
  "What's on the agenda today?",
  "Where should we begin?",
  "How can I help you today?",
  "Ready when you are.",
];

export function ChatApp() {
  const { user, isAuthenticated, refresh, logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [greeting, setGreeting] = useState(GREETINGS[0]);

  useEffect(() => {
    setGreeting(GREETINGS[Math.floor(Math.random() * GREETINGS.length)]);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadConversations = useCallback(async () => {
    if (!getToken()) return;
    try {
      const convs = await api.getConversations();
      setConversations(convs);
    } catch {
      /* token may be invalid */
    }
  }, []);

  const loadConversation = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const conv = await api.getConversation(id);
      setMessages(conv.messages);
      setActiveConversationId(id);
    } catch (err) {
      console.error("Failed to load conversation:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) loadConversations();
  }, [user, loadConversations]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  const handleNewChat = () => {
    setActiveConversationId(null);
    setMessages([]);
  };

  const handleSelectConversation = (id: string) => {
    loadConversation(id);
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await api.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConversationId === id) {
        handleNewChat();
      }
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  };

  const handleSend = async (content: string, fileIds: string[]) => {
    setSending(true);
    const tempUserMsg: Message = {
      id: "temp-user",
      role: "user",
      content,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const response = await api.sendMessage(content, activeConversationId || undefined, fileIds);
      setActiveConversationId(response.conversation_id);
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== "temp-user"),
        response.user_message,
        response.assistant_message,
      ]);
      await loadConversations();
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== "temp-user"));
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  const handleUpload = async (file: File) => {
    return api.uploadFile(file, activeConversationId || undefined);
  };

  const handleLogout = async () => {
    await logout();
    setConversations([]);
    setMessages([]);
    setActiveConversationId(null);
  };

  const handleAuthSuccess = async () => {
    await refresh();
    await loadConversations();
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-primary)]">
      <Sidebar
        conversations={conversations}
        activeId={activeConversationId}
        collapsed={sidebarCollapsed}
        userName={user?.name || null}
        userEmail={user?.email || null}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
        onLogin={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
        isAuthenticated={isAuthenticated}
      />

      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-[var(--border-color)] px-4 py-3">
          <button className="flex items-center gap-1 text-lg font-medium text-[var(--text-primary)]">
            ChatGPT
            <ChevronDown size={16} className="text-[var(--text-secondary)]" />
          </button>
          {!isAuthenticated && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAuthModalOpen(true)}
                className="rounded-full px-4 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
              >
                Log in
              </button>
              <button
                onClick={() => setAuthModalOpen(true)}
                className="rounded-full border border-[var(--border-color)] px-4 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
              >
                Sign up for free
              </button>
            </div>
          )}
        </header>

        <div className="flex flex-1 flex-col overflow-hidden">
          {messages.length === 0 && !loading ? (
            <div className="flex flex-1 flex-col items-center justify-center">
              <h1 className="mb-8 text-3xl font-medium text-[var(--text-primary)]">{greeting}</h1>
              <div className="w-full">
                <ChatInput
                  onSend={handleSend}
                  onUpload={handleUpload}
                  disabled={sending}
                  isAuthenticated={isAuthenticated}
                  onLoginRequired={() => setAuthModalOpen(true)}
                />
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto">
                {messages.map((msg) => (
                  <ChatMessage key={msg.id} message={msg} />
                ))}
                {sending && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </div>
              <ChatInput
                onSend={handleSend}
                onUpload={handleUpload}
                disabled={sending}
                isAuthenticated={isAuthenticated}
                onLoginRequired={() => setAuthModalOpen(true)}
              />
            </>
          )}
        </div>
      </main>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
