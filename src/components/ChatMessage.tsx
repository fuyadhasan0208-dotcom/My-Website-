import { GraduationCap, User } from 'lucide-react';
import type { ChatMessageItem } from '../types';
import { formatTimestamp } from '../utils/sanitize';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ChatMessageProps {
  message: ChatMessageItem;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div
          className="w-9 h-9 rounded-xl bg-[#4338CA] text-white flex items-center justify-center shrink-0 mt-1"
          aria-hidden="true"
        >
          <GraduationCap className="w-5 h-5" />
        </div>
      )}

      <div
        className={`max-w-[85%] sm:max-w-[78%] rounded-2xl px-4 py-3.5 ${
          isUser
            ? 'bg-[#1E1B4B] text-white'
            : 'bg-white border border-slate-200 text-[#1E1B4B]'
        }`}
      >
        <div className="flex items-center justify-between gap-4 mb-1.5 text-[11px]">
          <span className={`font-semibold ${isUser ? 'text-slate-300' : 'text-[#4338CA]'}`}>
            {isUser ? 'You' : 'EduGenius AI Tutor'}
          </span>
          <span
            className={`font-mono tabular-nums ${
              isUser ? 'text-slate-400' : 'text-slate-400'
            }`}
          >
            {formatTimestamp(message.timestamp)}
          </span>
        </div>

        {isUser ? (
          <p className="text-sm sm:text-[15px] leading-relaxed whitespace-pre-wrap break-words text-white">
            {message.content}
          </p>
        ) : (
          <MarkdownRenderer content={message.content} compact />
        )}
      </div>

      {isUser && (
        <div
          className="w-9 h-9 rounded-xl bg-slate-200 text-[#1E1B4B] flex items-center justify-center shrink-0 mt-1"
          aria-hidden="true"
        >
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );
}
