import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  MessageSquareText,
  Send,
  Sparkles,
} from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { GeminiServiceError, quickAsk } from '../services/geminiService';
import { sanitizeTextInput } from '../utils/sanitize';
import { FeatureCard } from '../components/FeatureCard';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { ErrorBanner } from '../components/ErrorBanner';
import heroWorkspaceImg from '../assets/images/hero_learning_workspace_1794629150736.jpg';

const HERO_IMAGE_PATH = heroWorkspaceImg;

const SAMPLE_QUESTIONS = {
  Bangla: [
    'নিউটনের গতির দ্বিতীয় সূত্র সহজভাবে বুঝিয়ে দাও',
    'সালোকসংশ্লেষণ প্রক্রিয়াটি ধাপে ধাপে ব্যাখ্যা করো',
  ],
  English: [
    'Explain how recursion works in Python with an example',
    'What is the difference between mitosis and meiosis?',
  ],
} as const;

export function Home() {
  const { settings } = useAppContext();
  const [imageFailed, setImageFailed] = useState(false);

  const [question, setQuestion] = useState('');
  const [heroLang, setHeroLang] = useState<'Bangla' | 'English'>(
    settings.preferredLanguage === 'English' ? 'English' : 'Bangla'
  );
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [answeredModel, setAnsweredModel] = useState<string | null>(null);
  const [error, setError] = useState<{
    message: string;
    needsConfiguration?: boolean;
  } | null>(null);

  const handleQuickAsk = async (e?: React.FormEvent, overrideQuestion?: string) => {
    e?.preventDefault();
    const clean = sanitizeTextInput(overrideQuestion ?? question, 1200);
    if (!clean) {
      setError({ message: 'Please write a study question before asking the AI.' });
      return;
    }

    setLoading(true);
    setError(null);
    setAnswer(null);

    try {
      const res = await quickAsk(clean, heroLang, settings);
      setAnswer(res.answer);
      setAnsweredModel(res.model);
    } catch (err) {
      if (err instanceof GeminiServiceError) {
        setError({
          message: err.message,
          needsConfiguration: err.needsConfiguration,
        });
      } else {
        setError({ message: 'Something went wrong while contacting Gemini AI.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#F8FAFC]">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-14 lg:pt-14 lg:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#4338CA]">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>Apex Edutech Labs</span>
              <span aria-hidden="true">·</span>
              <span>Smart Learning &amp; Education Assistant</span>
            </div>

            <h1
              className="font-display font-extrabold text-[#1E1B4B] tracking-tight leading-[1.18]"
              style={{ fontSize: 'clamp(2rem, 3.8vw, 3.35rem)', textWrap: 'balance' }}
            >
              যেকোনো বিষয় শিখুন ৩ গুণ দ্রুত AI-এর সহায়তায়
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
              আপনার ব্যক্তিগত AI Study Assistant। কঠিন বিষয় সহজভাবে বুঝুন, মুহূর্তেই কুইজ তৈরি
              করুন এবং স্মার্ট স্টাডি প্ল্যানের মাধ্যমে লক্ষ্যে পৌঁছান।
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-1">
              <Link
                to="/study-hub"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm sm:text-base font-semibold text-white bg-[#4338CA] hover:bg-[#3730A3] rounded-xl transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#4338CA]"
              >
                <span>Start Learning Free</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center justify-center px-6 py-3 text-sm sm:text-base font-semibold text-[#1E1B4B] bg-white border border-slate-200 hover:border-[#4338CA]/40 hover:bg-slate-50 rounded-xl transition-colors whitespace-nowrap shrink-0"
              >
                Explore AI Features
              </a>
            </div>
          </div>

          <div className="lg:col-span-5 flex">
            <div className="relative w-full min-h-[260px] lg:min-h-[360px] rounded-2xl overflow-hidden border border-slate-200 bg-[#1E1B4B]">
              {!imageFailed ? (
                <img
                  src={HERO_IMAGE_PATH}
                  alt="Minimalist student study workspace with open notebook and optical prism"
                  referrerPolicy="no-referrer"
                  onError={() => setImageFailed(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full p-8 flex flex-col justify-between bg-gradient-to-br from-[#1E1B4B] via-[#4338CA] to-[#7C3AED] text-white">
                  <BookOpen className="w-10 h-10 text-[#10B981]" />
                  <div>
                    <p className="font-display text-2xl font-bold">EduGenius AI</p>
                    <p className="text-sm text-slate-200 mt-1">
                      Bilingual Bangla &amp; English Learning Workspace
                    </p>
                  </div>
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-[#1E1B4B]/85 via-[#1E1B4B]/40 to-transparent text-white">
                <p className="text-xs font-medium text-slate-200">
                  Bangla &amp; English Academic Mastery
                </p>
                <p className="text-sm font-semibold mt-0.5">
                  SSC · HSC · University · Admission · Job Prep
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Interactive AI Question Box */}
        <div className="mt-10 bg-white rounded-2xl border border-slate-200 p-5 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="font-display text-lg sm:text-xl font-bold text-[#1E1B4B]">
                Instant Study Question Preview
              </h2>
              <p className="text-sm text-slate-600">
                Ask any concept in Bangla or English and test Gemini AI right from here.
              </p>
            </div>

            <div
              className="inline-flex items-center p-1 bg-slate-100 rounded-lg self-start sm:self-auto"
              role="group"
              aria-label="Select answer language"
            >
              <button
                type="button"
                onClick={() => setHeroLang('Bangla')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  heroLang === 'Bangla'
                    ? 'bg-white text-[#1E1B4B] shadow-xs'
                    : 'text-slate-600 hover:text-[#1E1B4B]'
                }`}
              >
                বাংলা
              </button>
              <button
                type="button"
                onClick={() => setHeroLang('English')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  heroLang === 'English'
                    ? 'bg-white text-[#1E1B4B] shadow-xs'
                    : 'text-slate-600 hover:text-[#1E1B4B]'
                }`}
              >
                English
              </button>
            </div>
          </div>

          <form onSubmit={handleQuickAsk} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="আপনার পড়াশোনার যেকোনো প্রশ্ন এখানে লিখুন..."
              aria-label="Ask a study question"
              className="flex-1 px-4 py-3 text-sm sm:text-base rounded-xl border border-slate-200 bg-[#F8FAFC] text-[#1E1B4B] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4338CA] focus:bg-white transition-colors"
            />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#4338CA] hover:bg-[#3730A3] disabled:opacity-60 rounded-xl transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? 'Thinking...' : 'Ask AI'}</span>
            </button>
          </form>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-medium">Try asking:</span>
            {SAMPLE_QUESTIONS[heroLang].map((sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => {
                  setQuestion(sample);
                  void handleQuickAsk(undefined, sample);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#4338CA]/10 hover:text-[#4338CA] text-slate-700 transition-colors cursor-pointer text-left"
              >
                {sample}
              </button>
            ))}
          </div>

          {loading && (
            <div className="mt-6 pt-6 border-t border-slate-100">
              <LoadingIndicator label="EduGenius AI is preparing your explanation..." lines={4} />
            </div>
          )}

          {error && (
            <div className="mt-6">
              <ErrorBanner
                message={error.message}
                needsConfiguration={error.needsConfiguration}
                onRetry={() => void handleQuickAsk()}
              />
            </div>
          )}

          {answer && !loading && (
            <div className="mt-6 pt-6 border-t border-slate-100 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#10B981]">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>AI Answer Preview</span>
                  {answeredModel && (
                    <>
                      <span aria-hidden="true" className="text-slate-300">
                        ·
                      </span>
                      <span className="text-slate-500 font-mono">{answeredModel}</span>
                    </>
                  )}
                </div>
                <Link
                  to="/study-hub"
                  className="text-xs font-semibold text-[#4338CA] hover:text-[#7C3AED] inline-flex items-center gap-1"
                >
                  <span>Explore deeper in AI Study Hub</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="p-4 sm:p-5 rounded-xl bg-[#F8FAFC] border border-slate-200">
                <MarkdownRenderer content={answer} />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Demonstration Statistics Strip */}
      <section className="border-y border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            <div className="space-y-1">
              <p className="font-display text-3xl sm:text-4xl font-extrabold text-[#1E1B4B] tabular-nums">
                50,000+
              </p>
              <p className="text-sm font-medium text-slate-600">Questions Solved</p>
            </div>
            <div className="space-y-1">
              <p className="font-display text-3xl sm:text-4xl font-extrabold text-[#4338CA] tabular-nums">
                10,000+
              </p>
              <p className="text-sm font-medium text-slate-600">Quizzes Generated</p>
            </div>
            <div className="space-y-1">
              <p className="font-display text-3xl sm:text-4xl font-extrabold text-[#10B981] tabular-nums">
                99.4%
              </p>
              <p className="text-sm font-medium text-slate-600">Satisfaction Rate</p>
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            Note: Above figures are demonstration platform metrics for MVP showcase and do not
            represent verified live telemetry.
          </p>
        </div>
      </section>

      {/* Core Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
        <div className="max-w-2xl space-y-2.5 mb-10">
          <p className="text-xs font-semibold text-[#4338CA]">Core Learning Workspace</p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#1E1B4B] tracking-tight">
            Built for Focused Understanding, Active Recall, and Exam Readiness
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Move seamlessly from breaking down a tough chapter to testing yourself with instant
            MCQs and chatting with your personal tutor.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard
            indexLabel="01"
            title="Instant Concept Explainer"
            description="Turn complex Science, Math, Programming, or HSC topics into step-by-step explanations with real-life examples, formulas, and one-click flashcards."
            icon={<BookOpen className="w-5 h-5" />}
            to="/study-hub"
            ctaLabel="Open AI Study Hub"
          />
          <FeatureCard
            indexLabel="02"
            title="AI Quiz & Mock Test Generator"
            description="Generate 5 to 20 structured MCQ questions by subject, difficulty, and language—complete with immediate answer feedback, explanations, and score analytics."
            icon={<ClipboardCheck className="w-5 h-5" />}
            to="/quiz"
            ctaLabel="Start Smart Quiz"
            featured
          />
          <FeatureCard
            indexLabel="03"
            title="24/7 Personal AI Tutor"
            description="Chat naturally in Bangla or English with an encouraging tutor that remembers conversation context, checks essays, and guides step-by-step problem solving."
            icon={<MessageSquareText className="w-5 h-5" />}
            to="/tutor"
            ctaLabel="Chat with AI Tutor"
          />
        </div>

        {/* Study Planner Banner */}
        <div className="mt-8 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-[#7C3AED]/10 text-[#7C3AED] flex items-center justify-center shrink-0">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-display text-lg sm:text-xl font-bold text-[#1E1B4B]">
                Personalized AI Study Planner
              </h3>
              <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
                Enter your exam date, daily available hours, and weak subjects to generate a
                balanced daily routine with subject time allocation, breaks, revision blocks, and
                weekly goals.
              </p>
            </div>
          </div>

          <Link
            to="/planner"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#1E1B4B] hover:bg-[#4338CA] rounded-xl transition-colors whitespace-nowrap shrink-0"
          >
            <span>Build Study Plan</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
