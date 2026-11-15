import React, { useEffect, useRef, useState } from 'react';
import { GraduationCap, Send, Trash2 } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { chatWithTutor, GeminiServiceError } from '../services/geminiService';
import { storageService } from '../services/storageService';
import { sanitizeTextInput } from '../utils/sanitize';
import type { ChatMessageItem, LearningLanguage, StudentLevel } from '../types';
import { ChatMessage } from '../components/ChatMessage';
import { ErrorBanner } from '../components/ErrorBanner';

const QUICK_PROMPTS = [
  'Check my English paragraph.',
  'Explain trigonometry formulas.',
  'Give me IELTS writing tips.',
  'Explain physics with real-life examples.',
  'Help me prepare for my admission test.',
] as const;

const LEVELS: StudentLevel[] = [
  'Primary',
  'Secondary (SSC)',
  'Higher Secondary (HSC)',
  'University',
  'Admission Preparation',
  'Job Preparation',
];

const LANGUAGES: LearningLanguage[] = ['Bangla', 'English', 'Mixed Bangla-English'];

export function AITutor() {
  const { settings, confirmAction, showToast } = useAppContext();

  const [messages, setMessages] = useState<ChatMessageItem[]>(() =>
    storageService.getChatHistory()
  );
  const [level, setLevel] = useState<StudentLevel>(settings.defaultLevel);
  const [language, setLanguage] = useState<LearningLanguage>(settings.preferredLanguage);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<{
    message: string;
    needsConfiguration?: boolean;
  } | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const sendMessage = async (textOverride?: string) => {
    const clean = sanitizeTextInput(textOverride ?? input, 2500);
    if (!clean || sending) return;

    const userMsg: ChatMessageItem = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: clean,
      timestamp: new Date().toISOString(),
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    storageService.saveChatHistory(nextHistory);
    if (!textOverride) {
      setInput('');
    }
    setSending(true);
    setError(null);

    try {
      const res = await chatWithTutor(
        {
          message: clean,
          history: messages,
          level,
          language,
        },
        settings
      );

      const tutorMsg: ChatMessageItem = {
        id: `tutor-${Date.now()}`,
        role: 'model',
        content: res.reply,
        timestamp: new Date().toISOString(),
      };

      const updated = [...nextHistory, tutorMsg];
      setMessages(updated);
      storageService.saveChatHistory(updated);
    } catch (err) {
      if (err instanceof GeminiServiceError) {
        setError({
          message: err.message,
          needsConfiguration: err.needsConfiguration,
        });
      } else {
        setError({ message: 'Unable to reach AI Tutor right now. Please try again.' });
      }
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  const handleClearChat = () => {
    if (messages.length === 0) return;
    confirmAction({
      title: 'Clear Conversation History?',
      description:
        'This will permanently remove your local AI Tutor chat history from this browser.',
      confirmLabel: 'Clear Chat',
      destructive: true,
      onConfirm: () => {
        storageService.clearChatHistory();
        setMessages([]);
        setError(null);
        showToast({ type: 'info', title: 'Chat history cleared' });
      },
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-[#4338CA]">24/7 AI Tutor</p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#1E1B4B] tracking-tight">
            Personal Interactive Study Mentor
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            aria-label="Tutor Student Level"
            value={level}
            onChange={(e) => setLevel(e.target.value as StudentLevel)}
            className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white text-[#1E1B4B] focus:outline-none focus:ring-2 focus:ring-[#4338CA]"
          >
            {LEVELS.map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl}
              </option>
            ))}
          </select>

          <select
            aria-label="Tutor Preferred Language"
            value={language}
            onChange={(e) => setLanguage(e.target.value as LearningLanguage)}
            className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white text-[#1E1B4B] focus:outline-none focus:ring-2 focus:ring-[#4338CA]"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleClearChat}
            disabled={messages.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-red-700 bg-white border border-slate-200 hover:bg-red-50 hover:border-red-200 disabled:opacity-40 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Chat</span>
          </button>
        </div>
      </div>

      {/* Chat Workspace Card */}
      <div className="bg-white rounded-2xl border border-slate-200 flex flex-col h-[calc(100vh-230px)] min-h-[520px] max-h-[760px] overflow-hidden">
        {/* Quick Prompt Suggestions Strip */}
        <div className="px-4 sm:px-6 py-3 border-b border-slate-200 bg-[#F8FAFC] flex items-center gap-2 overflow-x-auto custom-scrollbar">
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap shrink-0">
            Quick Prompts:
          </span>
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              disabled={sending}
              onClick={() => void sendMessage(prompt)}
              className="px-3 py-1.5 text-xs font-medium text-[#1E1B4B] bg-white border border-slate-200 hover:border-[#4338CA] hover:text-[#4338CA] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Messages Viewport */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-5 bg-[#F8FAFC]/60">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center">
                <GraduationCap className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <h2 className="font-display text-xl font-bold text-[#1E1B4B]">
                  Ask Your 24/7 AI Tutor Anything
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Paste an English paragraph for feedback, solve a math or physics problem step by
                  step, or ask questions in বাংলা or English. Conversation context is saved
                  automatically.
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)
          )}

          {sending && (
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#4338CA] text-white flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-600 flex items-center gap-2">
                <span
                  className="w-3.5 h-3.5 rounded-full border-2 border-[#4338CA]/25 border-t-[#4338CA] animate-spin"
                  aria-hidden="true"
                />
                <span>EduGenius AI Tutor is typing...</span>
              </div>
            </div>
          )}

          {error && (
            <ErrorBanner
              message={error.message}
              needsConfiguration={error.needsConfiguration}
            />
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input Composer */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void sendMessage();
          }}
          className="p-4 sm:px-6 sm:py-4 border-t border-slate-200 bg-white"
        >
          <div className="flex items-end gap-3">
            <textarea
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Write your question in Bangla or English... (Press Enter to send, Shift+Enter for new line)"
              aria-label="Message AI Tutor"
              className="flex-1 px-4 py-2.5 text-sm sm:text-[15px] rounded-xl border border-slate-200 bg-[#F8FAFC] text-[#1E1B4B] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4338CA] focus:bg-white resize-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-[#4338CA] hover:bg-[#3730A3] disabled:opacity-50 rounded-xl transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Send className="w-4 h-4" />
              <span>Send</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
