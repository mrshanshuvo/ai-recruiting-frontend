import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { PlusCircle, Loader2, RefreshCw } from 'lucide-react';
import { createConversation, sendMessage, API_BASE_URL } from '../api/client';
import { useConversationStream } from '../hooks/useConversationStream';
import { MessageBubble } from '../components/chat/MessageBubble';
import { ChatInputBar } from '../components/chat/ChatInputBar';

export const ChatPage: React.FC = () => {
  const { id: routeConversationId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Session initialization / redirection logic per DEC-22
  useEffect(() => {
    async function initSession() {
      if (!routeConversationId) {
        const queryConvId = searchParams.get('conversationId');
        const savedId = queryConvId || localStorage.getItem('conversationId');
        if (savedId) {
          navigate(`/chat/${savedId}`, { replace: true });
        } else {
          try {
            const data = await createConversation();
            localStorage.setItem('conversationId', data.conversationId);
            navigate(`/chat/${data.conversationId}`, { replace: true });
          } catch (err) {
            console.error('[ChatPage] Failed to initialize conversation:', err);
          }
        }
      } else {
        localStorage.setItem('conversationId', routeConversationId);
      }
    }

    initSession();
  }, [routeConversationId, searchParams, navigate]);

  // 2. Stream and messages hook
  const { messages, setMessages, isLoading, sourcingProgress, reloadHistory } =
    useConversationStream(routeConversationId);

  // 3. Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 4. Send message handler
  const handleSendMessage = async (text: string) => {
    if (!routeConversationId) return;

    // Optimistically add user message to list
    const tempUserMsgId = `temp-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        _id: tempUserMsgId,
        conversationId: routeConversationId,
        role: 'user',
        parts: [{ type: 'text', text }],
        createdAt: new Date().toISOString(),
      },
    ]);

    try {
      await sendMessage(routeConversationId, text);
      await reloadHistory();
    } catch (err) {
      console.error('[ChatPage] Failed to send message:', err);
    }
  };

  // 5. New chat button
  const handleNewChat = async () => {
    try {
      const data = await createConversation();
      localStorage.setItem('conversationId', data.conversationId);
      navigate(`/chat/${data.conversationId}`);
    } catch (err) {
      console.error('[ChatPage] Failed to start new chat:', err);
    }
  };

  // 6. CSV Upload handler from chat paperclip per B6
  const handleUploadCsv = async (file: File) => {
    if (!routeConversationId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/jobs`);
      const data = await res.json();
      if (!data.jobs || data.jobs.length === 0) {
        alert('Please create or propose a job first before uploading candidates.');
        return;
      }
      const targetJob = data.jobs[0];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('conversationId', routeConversationId);

      await fetch(`${API_BASE_URL}/api/jobs/${targetJob._id}/candidates/upload-csv`, {
        method: 'POST',
        body: formData,
      });
    } catch (err) {
      console.error('[ChatPage] CSV Upload error:', err);
    }
  };

  if (!routeConversationId || isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="flex items-center space-x-2 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading chat session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Top action bar */}
      <div className="flex items-center justify-between px-6 py-2 bg-white border-b border-slate-200">
        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <span>Conversation ID:</span>
          <code className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">{routeConversationId}</code>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => reloadHistory()}
            title="Refresh history"
            className="p-1.5 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleNewChat}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-medium transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Chat</span>
          </button>
        </div>
      </div>

      {/* Sourcing Progress Banner if active */}
      {sourcingProgress && (
        <div className="bg-indigo-50 border-b border-indigo-100 px-6 py-3 flex items-center justify-between text-xs text-indigo-900">
          <div className="flex items-center space-x-2">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
            <span className="font-semibold">Candidate Sourcing & Scoring in progress:</span>
            <span>
              Found <strong>{sourcingProgress.found}</strong>, scored <strong>{sourcingProgress.scored}</strong> / {sourcingProgress.total}
            </span>
          </div>
          <span className="text-indigo-600 font-medium uppercase tracking-wider">In Progress</span>
        </div>
      )}

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="max-w-4xl mx-auto">
          {messages.map((msg) => (
            <MessageBubble
              key={msg._id}
              message={msg}
              sourcingProgress={
                sourcingProgress?.jobId
                  ? { [sourcingProgress.jobId]: sourcingProgress }
                  : undefined
              }
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Chat Input Bar */}
      <ChatInputBar onSendMessage={handleSendMessage} onUploadCsv={handleUploadCsv} />
    </div>
  );
};

