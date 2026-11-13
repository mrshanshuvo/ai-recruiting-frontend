import { useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL, getMessages } from '../api/client';
import { Message, SourcingProgress, IMessagePart } from '../types/chat';

export function useConversationStream(conversationId: string | undefined) {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [sourcingProgress, setSourcingProgress] = useState<SourcingProgress | null>(null);

  // Load initial history
  const reloadHistory = useCallback(async () => {
    if (!conversationId) return;
    try {
      setIsLoading(true);
      const data = await getMessages(conversationId);
      setMessages(data.messages || []);
    } catch (err) {
      console.error('[useConversationStream] Error loading history:', err);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    reloadHistory();
  }, [reloadHistory]);

  // Connect SSE
  useEffect(() => {
    if (!conversationId) return;

    const streamUrl = `${API_BASE_URL}/api/chat/stream/${conversationId}`;
    const eventSource = new EventSource(streamUrl);

    eventSource.onopen = () => {
      console.log('[SSE] Connection opened:', streamUrl);
    };

    eventSource.onerror = (err) => {
      console.warn('[SSE] EventSource encountered error/reconnecting:', err);
    };

    // 1. Text deltas during streaming agent responses
    eventSource.addEventListener('CHAT_DELTA', (e: MessageEvent) => {
      try {
        const { messageId, delta } = JSON.parse(e.data);
        setMessages((prev) => {
          const index = prev.findIndex((m) => m._id === messageId);
          if (index === -1) {
            return [
              ...prev,
              {
                _id: messageId,
                conversationId,
                role: 'assistant',
                parts: [{ type: 'text', text: delta }],
                createdAt: new Date().toISOString(),
              },
            ];
          }
          const updated = [...prev];
          const targetMsg = { ...updated[index] };
          const parts = [...targetMsg.parts];
          if (parts.length > 0 && parts[parts.length - 1].type === 'text') {
            const lastPart = parts[parts.length - 1] as { type: 'text'; text: string };
            parts[parts.length - 1] = { type: 'text', text: lastPart.text + delta };
          } else {
            parts.push({ type: 'text', text: delta });
          }
          targetMsg.parts = parts;
          updated[index] = targetMsg;
          return updated;
        });
      } catch (err) {
        console.error('[SSE] Error handling CHAT_DELTA:', err);
      }
    });

    // 2. Completed card or text parts emitted by tools
    eventSource.addEventListener('CHAT_PART', (e: MessageEvent) => {
      try {
        const { messageId, part } = JSON.parse(e.data) as {
          messageId: string;
          partIndex: number;
          part: IMessagePart;
        };

        setMessages((prev) => {
          const index = prev.findIndex((m) => m._id === messageId);
          if (index === -1) {
            return [
              ...prev,
              {
                _id: messageId,
                conversationId,
                role: 'assistant',
                parts: [part],
                createdAt: new Date().toISOString(),
              },
            ];
          }
          const updated = [...prev];
          const targetMsg = { ...updated[index] };
          targetMsg.parts = [...targetMsg.parts, part];
          updated[index] = targetMsg;
          return updated;
        });
      } catch (err) {
        console.error('[SSE] Error handling CHAT_PART:', err);
      }
    });

    // 3. Sourcing progress counter
    eventSource.addEventListener('SOURCING_PROGRESS', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data) as SourcingProgress;
        setSourcingProgress(data);
      } catch (err) {
        console.error('[SSE] Error handling SOURCING_PROGRESS:', err);
      }
    });

    // 4. Card confirmation / cancellation updates
    eventSource.addEventListener('CARD_UPDATED', (e: MessageEvent) => {
      try {
        const { actionId, status } = JSON.parse(e.data);
        setMessages((prev) =>
          prev.map((msg) => {
            const hasAction = msg.parts.some(
              (p) => p.type === 'card' && p.card.actionId === actionId
            );
            if (!hasAction) return msg;

            return {
              ...msg,
              parts: msg.parts.map((p) => {
                if (p.type === 'card' && p.card.actionId === actionId) {
                  return {
                    ...p,
                    card: { ...p.card, status },
                  };
                }
                return p;
              }),
            };
          })
        );
        queryClient.invalidateQueries({ queryKey: ['jobs'] });
        queryClient.invalidateQueries({ queryKey: ['candidates'] });
      } catch (err) {
        console.error('[SSE] Error handling CARD_UPDATED:', err);
      }
    });

    // 5. Candidate status mutations
    eventSource.addEventListener('CANDIDATE_STATUS_CHANGED', () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      queryClient.invalidateQueries({ queryKey: ['jobStats'] });
    });

    return () => {
      console.log('[SSE] Closing EventSource connection');
      eventSource.close();
    };
  }, [conversationId, queryClient]);

  return {
    messages,
    setMessages,
    isLoading,
    sourcingProgress,
    reloadHistory,
  };
}

