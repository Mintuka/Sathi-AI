const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationDetail extends Conversation {
  messages: Message[];
}

export interface UploadedFile {
  id: string;
  filename: string;
  original_name: string;
  content_type: string;
  size: number;
  created_at: string;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

export function setToken(token: string) {
  localStorage.setItem("access_token", token);
}

export function clearToken() {
  localStorage.removeItem("access_token");
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || "Request failed");
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

export const api = {
  register: (email: string, password: string, name: string) =>
    apiFetch<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    }),

  login: (email: string, password: string) =>
    apiFetch<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  logout: () => apiFetch<{ message: string }>("/api/auth/logout", { method: "POST" }),

  me: () => apiFetch<User>("/api/auth/me"),

  getConversations: () => apiFetch<Conversation[]>("/api/chat/conversations"),

  createConversation: () =>
    apiFetch<Conversation>("/api/chat/conversations", { method: "POST" }),

  getConversation: (id: string) => apiFetch<ConversationDetail>(`/api/chat/conversations/${id}`),

  deleteConversation: (id: string) =>
    apiFetch<void>(`/api/chat/conversations/${id}`, { method: "DELETE" }),

  sendMessage: (content: string, conversationId?: string, fileIds?: string[]) =>
    apiFetch<{
      conversation_id: string;
      user_message: Message;
      assistant_message: Message;
    }>("/api/chat", {
      method: "POST",
      body: JSON.stringify({
        content,
        conversation_id: conversationId || null,
        file_ids: fileIds || [],
      }),
    }),

  uploadFile: (file: File, conversationId?: string) => {
    const formData = new FormData();
    formData.append("file", file);
    const url = conversationId
      ? `/api/files/upload?conversation_id=${conversationId}`
      : "/api/files/upload";
    return apiFetch<UploadedFile>(url, {
      method: "POST",
      body: formData,
      headers: {},
    });
  },
};
