import React from 'react';
import { Bot, User } from 'lucide-react';
import { Message } from '../../types/chat';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex w-full my-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-3xl space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white ${
            isUser ? 'bg-indigo-600' : 'bg-slate-700'
          }`}
        >
          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </div>

        {/* Message Content */}
        <div className="space-y-3">
          {message.parts.map((part, index) => {
            if (part.type === 'text') {
              return (
                <div
                  key={index}
                  className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-tr-none shadow-sm'
                      : 'bg-white text-slate-800 rounded-tl-none border border-slate-200 shadow-sm'
                  }`}
                >
                  {part.text}
                </div>
              );
            }

            if (part.type === 'card') {
              return (
                <div
                  key={index}
                  className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm"
                >
                  <div className="text-xs font-semibold uppercase text-indigo-600 mb-2">
                    Card: {part.card.cardType} ({part.card.status})
                  </div>
                  <pre className="text-xs bg-slate-50 p-2 rounded overflow-x-auto text-slate-700">
                    {JSON.stringify(part.card.payload, null, 2)}
                  </pre>
                </div>
              );
            }

            return null;
          })}
        </div>
      </div>
    </div>
  );
};

