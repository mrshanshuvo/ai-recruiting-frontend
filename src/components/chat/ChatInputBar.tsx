import React, { useState } from 'react';
import { Send } from 'lucide-react';

interface ChatInputBarProps {
  onSendMessage: (text: string) => Promise<void>;
  disabled?: boolean;
}

export const ChatInputBar: React.FC<ChatInputBarProps> = ({ onSendMessage, disabled = false }) => {
  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || disabled || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setInput('');
      await onSendMessage(trimmed);
    } catch (err) {
      console.error('[ChatInputBar] Error sending message:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-slate-200 bg-white p-4">
      <div className="flex items-end space-x-2 max-w-4xl mx-auto">
        <div className="flex-1 relative rounded-xl border border-slate-300 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 bg-white shadow-sm">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message or paste a job description... (Enter to send, Shift+Enter for newline)"
            rows={2}
            disabled={disabled || isSubmitting}
            className="w-full resize-none p-3 text-sm focus:outline-none rounded-xl"
          />
        </div>
        <button
          type="submit"
          disabled={!input.trim() || disabled || isSubmitting}
          className="h-11 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl flex items-center justify-center transition shadow-sm"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
};

