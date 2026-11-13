import { Message } from '../types/chat';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export interface CreateConversationResponse {
  success: boolean;
  conversationId: string;
  greeting: {
    messageId: string;
    text: string;
  };
}

export interface GetMessagesResponse {
  success: boolean;
  messages: Message[];
}

export interface SendMessageResponse {
  success: boolean;
  messageId: string;
  conversationId: string;
}

export async function createConversation(): Promise<CreateConversationResponse> {
  const res = await fetch(`${API_BASE_URL}/api/conversations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });

  if (!res.ok) {
    throw new Error(`Failed to create conversation: ${res.statusText}`);
  }

  return res.json();
}

export async function getMessages(conversationId: string): Promise<GetMessagesResponse> {
  const res = await fetch(`${API_BASE_URL}/api/chat/messages/${conversationId}`);

  if (!res.ok) {
    throw new Error(`Failed to fetch messages: ${res.statusText}`);
  }

  return res.json();
}

export async function sendMessage(conversationId: string, text: string): Promise<SendMessageResponse> {
  const res = await fetch(`${API_BASE_URL}/api/chat/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversationId, text }),
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    const message = errorJson.error?.message || res.statusText;
    throw new Error(message);
  }

  return res.json();
}

export async function confirmAction(
  actionId: string,
  modifiedPayload?: Record<string, any>
): Promise<{ success: boolean; actionId: string; status: string; result?: any }> {
  const res = await fetch(`${API_BASE_URL}/api/actions/${actionId}/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ modifiedPayload }),
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.error?.message || `Failed to confirm action: ${res.statusText}`);
  }

  return res.json();
}

export async function cancelAction(
  actionId: string,
  reason?: string
): Promise<{ success: boolean; actionId: string; status: string }> {
  const res = await fetch(`${API_BASE_URL}/api/actions/${actionId}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.error?.message || `Failed to cancel action: ${res.statusText}`);
  }

  return res.json();
}

export async function patchActionPayload(
  actionId: string,
  editedPayload: Record<string, any>
): Promise<{ success: boolean; actionId: string; status: string }> {
  const res = await fetch(`${API_BASE_URL}/api/actions/${actionId}/payload`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ editedPayload }),
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.error?.message || `Failed to autosave payload: ${res.statusText}`);
  }

  return res.json();
}

export async function updateCandidateStatus(
  candidateId: string,
  newStatus: string,
  reason?: string
): Promise<{ success: boolean; candidateId: string; previousStatus: string; newStatus: string }> {
  const res = await fetch(`${API_BASE_URL}/api/candidates/${candidateId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newStatus, reason }),
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.error?.message || `Failed to update status: ${res.statusText}`);
  }

  return res.json();
}

export async function simulateReply(data: {
  candidateId: string;
  message: string;
}): Promise<{ success: boolean; jobId: string; candidateId: string; message: string }> {
  const res = await fetch(`${API_BASE_URL}/simulate-reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      candidateId: data.candidateId,
      message: data.message,
    }),
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.error?.message || `Failed to simulate reply: ${res.statusText}`);
  }

  return res.json();
}
