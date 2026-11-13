import React, { useState, useRef } from 'react';
import { Send, Paperclip } from 'lucide-react';

interface ChatInputBarProps {
  onSendMessage: (text: string) => Promise<void>;
  onUploadCsv?: (file: File) => Promise<void>;
  disabled?: boolean;
}

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
  onSendMessage,
  onUploadCsv,
  disabled = false,
}) => {
  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadCsv) {
      try {
        setIsSubmitting(true);
        await onUploadCsv(file);
      } catch (err) {
        console.error('[ChatInputBar] CSV upload failed:', err);
      } finally {
        setIsSubmitting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-slate-200 bg-white p-4">
      <div className="flex items-end space-x-2 max-w-4xl mx-auto">
        {onUploadCsv && (
          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isSubmitting}
              title="Upload Candidate CSV"
              className="h-11 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl flex items-center justify-center transition border border-slate-200"
            >
              <Paperclip className="w-4 h-4" />
            </button>
          </div>
        )}
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

