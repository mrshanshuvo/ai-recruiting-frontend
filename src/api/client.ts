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
    throw new Error(`Failed to send message: ${res.statusText}`);
  }

  return res.json();
}

