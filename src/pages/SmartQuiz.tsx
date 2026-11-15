import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  PlusCircle,
  RotateCcw,
} from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { GeminiServiceError, generateQuiz } from '../services/geminiService';
import { storageService } from '../services/storageService';
import { formatShortDate, sanitizeTextInput } from '../utils/sanitize';
import type {
  QuizAttemptSummary,
  QuizConfig,
  QuizDifficulty,
  QuizQuestion,
  StudentLevel,
  SubjectOption,
} from '../types';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { ProgressBar } from '../components/ProgressBar';
import { QuizCard } from '../components/QuizCard';
import { ErrorBanner } from '../components/ErrorBanner';

const SUBJECTS: SubjectOption[] = [
  'Science',
  'Mathematics',
  'English',
  'General Knowledge',
  'Programming',
  'Physics',
  'Chemistry',
  'Biology',
  'Other',
];

const LEVELS: StudentLevel[] = [
  'Primary',
  'Secondary (SSC)',
  'Higher Secondary (HSC)',
  'University',
  'Admission Preparation',
  'Job Preparation',
];

const COUNTS: Array<5 | 10 | 15 | 20> = [5, 10, 15, 20];
const DIFFICULTIES: QuizDifficulty[] = ['Easy', 'Medium', 'Hard'];

export function SmartQuiz() {
  const { settings, showToast } = useAppContext();

  const [subject, setSubject] = useState<SubjectOption>('Science');
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState<StudentLevel>(settings.defaultLevel);
  const [questionCount, setQuestionCount] = useState<5 | 10 | 15 | 20>(5);
  const [difficulty, setDifficulty] = useState<QuizDifficulty>('Medium');
  const [language, setLanguage] = useState<'Bangla' | 'English'>(
    settings.preferredLanguage === 'English' ? 'English' : 'Bangla'
  );

  const [phase, setPhase] = useState<'setup' | 'active' | 'results'>('setup');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{
    message: string;
    needsConfiguration?: boolean;
  } | null>(null);

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showReview, setShowReview] = useState(false);
  const [history, setHistory] = useState<QuizAttemptSummary[]>(() =>
    storageService.getQuizHistory()
  );

  const handleGenerateQuiz = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const cleanTopic = sanitizeTextInput(topic, 1500);
    if (!cleanTopic) {
      setError({ message: 'Please enter a chapter or topic for your quiz.' });
      return;
    }

    setLoading(true);
    setError(null);

    const config: QuizConfig = {
      subject,
      topic: cleanTopic,
      level,
      questionCount,
      difficulty,
      language,
    };

    try {
      const result = await generateQuiz(config, settings);
      setQuestions(result.questions);
      setCurrentIndex(0);
      setAnswers({});
      setShowReview(false);
      setPhase('active');
      showToast({
        type: 'success',
        title: 'Quiz generated',
        description: `${result.questions.length} ${difficulty} questions ready.`,
      });
    } catch (err) {
      if (err instanceof GeminiServiceError) {
        setError({
          message: err.message,
          needsConfiguration: err.needsConfiguration,
        });
      } else {
        setError({ message: 'Unable to generate quiz questions. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (optionIndex: number) => {
    const q = questions[currentIndex];
    if (!q || answers[q.id] !== undefined) return;
    setAnswers((prev) => ({ ...prev, [q.id]: optionIndex }));
  };

  const handleRestartQuestion = () => {
    const q = questions[currentIndex];
    if (!q) return;
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[q.id];
      return next;
    });
  };

  const handleFinishQuiz = () => {
    const total = questions.length;
    const correct = questions.reduce(
      (acc, q) => acc + (answers[q.id] === q.correctAnswerIndex ? 1 : 0),
      0
    );
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    const summary: QuizAttemptSummary = {
      id: `attempt-${Date.now()}`,
      subject,
      topic: topic.trim(),
      totalQuestions: total,
      correctCount: correct,
      accuracy,
      difficulty,
      createdAt: new Date().toISOString(),
    };
    setHistory(storageService.saveQuizAttempt(summary));
    setPhase('results');
  };

  const handleRetake = () => {
    setAnswers({});
    setCurrentIndex(0);
    setShowReview(false);
    setPhase('active');
  };

  const stats = useMemo(() => {
    const total = questions.length;
    const correct = questions.reduce(
      (acc, q) => acc + (answers[q.id] === q.correctAnswerIndex ? 1 : 0),
      0
    );
    const answeredCount = Object.keys(answers).length;
    const incorrect = Math.max(0, total - correct);
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    let performanceMessage = 'Keep practicing! Review the explanations below to strengthen weak areas.';
    if (accuracy >= 90) {
      performanceMessage = 'Outstanding mastery! You demonstrated strong command over this topic.';
    } else if (accuracy >= 70) {
      performanceMessage = 'Great job! A quick review of the missed questions will push you to mastery.';
    } else if (accuracy >= 50) {
      performanceMessage = 'Solid foundation. Revisit key definitions in the AI Study Hub and retake.';
    }

    const chartData = [
      { name: 'Correct', count: correct, fill: '#10B981' },
      { name: 'Incorrect / Missed', count: incorrect, fill: '#DC2626' },
    ];

    return { total, correct, incorrect, answeredCount, accuracy, performanceMessage, chartData };
  }, [questions, answers]);

  const currentQuestion = questions[currentIndex];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <div className="mb-8 space-y-2">
        <p className="text-xs font-semibold text-[#4338CA]">Smart AI Quiz Generator</p>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#1E1B4B] tracking-tight">
          Interactive MCQ Mock Test Engine
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl">
          Generate custom multiple-choice quizzes with instant answer verification, explanations,
          and performance analytics.
        </p>
      </div>

      {error && (
        <div className="mb-6">
          <ErrorBanner
            message={error.message}
            needsConfiguration={error.needsConfiguration}
            onRetry={() => void handleGenerateQuiz()}
          />
        </div>
      )}

      {phase === 'setup' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={handleGenerateQuiz}
            className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="quiz-subject"
                  className="block text-xs font-semibold text-[#1E1B4B] mb-1.5"
                >
                  Subject
                </label>
                <select
                  id="quiz-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value as SubjectOption)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-[#F8FAFC] text-[#1E1B4B] focus:outline-none focus:ring-2 focus:ring-[#4338CA]"
                >
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="quiz-level"
                  className="block text-xs font-semibold text-[#1E1B4B] mb-1.5"
                >
                  Student Level
                </label>
                <select
                  id="quiz-level"
                  value={level}
                  onChange={(e) => setLevel(e.target.value as StudentLevel)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-[#F8FAFC] text-[#1E1B4B] focus:outline-none focus:ring-2 focus:ring-[#4338CA]"
                >
                  {LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="quiz-topic"
                className="block text-xs font-semibold text-[#1E1B4B] mb-1.5"
              >
                Chapter / Topic
              </label>
              <input
                id="quiz-topic"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Quadratic Equations, Cell Division, English Prepositions, বা চলতড়িৎ"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-[#F8FAFC] text-[#1E1B4B] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4338CA] focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <span className="block text-xs font-semibold text-[#1E1B4B] mb-1.5">
                  Number of Questions
                </span>
                <div className="grid grid-cols-4 gap-1.5">
                  {COUNTS.map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setQuestionCount(cnt)}
                      className={`py-2 text-xs font-mono font-semibold rounded-lg border transition-colors cursor-pointer ${
                        questionCount === cnt
                          ? 'bg-[#4338CA] text-white border-[#4338CA]'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {cnt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="block text-xs font-semibold text-[#1E1B4B] mb-1.5">
                  Difficulty
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {DIFFICULTIES.map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setDifficulty(diff)}
                      className={`py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                        difficulty === diff
                          ? 'bg-[#1E1B4B] text-white border-[#1E1B4B]'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="block text-xs font-semibold text-[#1E1B4B] mb-1.5">
                  Language
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['Bangla', 'English'] as const).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setLanguage(lang)}
                      className={`py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                        language === lang
                          ? 'bg-[#7C3AED] text-white border-[#7C3AED]'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {loading ? (
              <div className="pt-2">
                <LoadingIndicator
                  label={`Generating ${questionCount} validated MCQ questions...`}
                  lines={4}
                />
              </div>
            ) : (
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#4338CA] hover:bg-[#3730A3] rounded-xl transition-colors cursor-pointer"
              >
                <ClipboardCheck className="w-4 h-4" />
                <span>Generate Quiz</span>
              </button>
            )}
          </form>

          {/* Recent Quiz Attempts */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4">
            <h2 className="font-display text-base font-bold text-[#1E1B4B]">
              Recent Quiz Scores
            </h2>
            {history.length === 0 ? (
              <p className="text-sm text-slate-500 leading-relaxed">
                Complete a quiz to track your accuracy and recent subject scores here.
              </p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar pr-1">
                {history.slice(0, 8).map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-[#F8FAFC] border border-slate-200 space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-[#1E1B4B] truncate">
                        {item.topic}
                      </span>
                      <span
                        className={`text-xs font-mono font-bold tabular-nums shrink-0 ${
                          item.accuracy >= 70 ? 'text-[#10B981]' : 'text-[#4338CA]'
                        }`}
                      >
                        {item.accuracy}%
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {item.subject} · {item.correctCount}/{item.totalQuestions} ·{' '}
                      {formatShortDate(item.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {phase === 'active' && currentQuestion && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
            <ProgressBar
              current={Object.keys(answers).length}
              total={questions.length}
              label={`${subject}: ${topic} (${difficulty})`}
            />
          </div>

          <QuizCard
            question={currentQuestion}
            questionIndex={currentIndex}
            totalQuestions={questions.length}
            selectedOptionIndex={answers[currentQuestion.id] ?? null}
            onSelectOption={handleSelectOption}
            onRestartQuestion={handleRestartQuestion}
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-[#1E1B4B] bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 rounded-xl transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous Question</span>
            </button>

            <div className="flex items-center gap-3">
              {currentIndex < questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() =>
                    setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))
                  }
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#4338CA] hover:bg-[#3730A3] rounded-xl transition-colors cursor-pointer"
                >
                  <span>Next Question</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinishQuiz}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-[#10B981] hover:bg-[#059669] rounded-xl transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>View Quiz Results</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {phase === 'results' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#10B981]">
                  <Award className="w-4 h-4" />
                  <span>Quiz Completed</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-slate-500">{subject}</span>
                </div>
                <h2 className="font-display text-2xl font-bold text-[#1E1B4B]">
                  {topic}
                </h2>
                <p className="text-sm text-slate-600">{stats.performanceMessage}</p>
              </div>

              <div className="text-left sm:text-right shrink-0">
                <p className="text-xs font-medium text-slate-500">Accuracy</p>
                <p className="font-display text-4xl font-extrabold text-[#4338CA] tabular-nums">
                  {stats.accuracy}%
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-slate-200">
                <p className="text-xs text-slate-500 font-medium">Total Questions</p>
                <p className="font-display text-2xl font-bold text-[#1E1B4B] tabular-nums mt-1">
                  {stats.total}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#10B981]/5 border border-[#10B981]/25">
                <p className="text-xs text-[#10B981] font-semibold">Correct Answers</p>
                <p className="font-display text-2xl font-bold text-[#10B981] tabular-nums mt-1">
                  {stats.correct}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                <p className="text-xs text-red-700 font-semibold">Incorrect / Missed</p>
                <p className="font-display text-2xl font-bold text-red-700 tabular-nums mt-1">
                  {stats.incorrect}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-slate-200">
                <p className="text-xs text-slate-500 font-medium">Difficulty</p>
                <p className="font-display text-2xl font-bold text-[#1E1B4B] mt-1">
                  {difficulty}
                </p>
              </div>
            </div>

            {/* Score Visualization */}
            <div className="pt-2">
              <h3 className="text-xs font-semibold text-slate-600 mb-3">
                Score Breakdown Visualization
              </h3>
              <div className="h-52 w-full bg-[#F8FAFC] rounded-xl border border-slate-200 p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.chartData} layout="vertical" margin={{ left: 16, right: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis type="number" allowDecimals={false} domain={[0, stats.total]} />
                    <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={28}>
                      {stats.chartData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleRetake}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#4338CA] hover:bg-[#3730A3] rounded-xl transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retake Quiz</span>
              </button>
              <button
                type="button"
                onClick={() => setPhase('setup')}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-[#1E1B4B] bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Generate Another Quiz</span>
              </button>
              <button
                type="button"
                onClick={() => setShowReview((v) => !v)}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-[#7C3AED] bg-[#7C3AED]/10 hover:bg-[#7C3AED]/15 rounded-xl transition-colors cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>{showReview ? 'Hide Answer Review' : 'Review Answers'}</span>
              </button>
            </div>
          </div>

          {showReview && (
            <div className="space-y-4">
              <h3 className="font-display text-lg font-bold text-[#1E1B4B]">
                Detailed Answer Review
              </h3>
              {questions.map((q, idx) => (
                <QuizCard
                  key={q.id}
                  question={q}
                  questionIndex={idx}
                  totalQuestions={questions.length}
                  selectedOptionIndex={answers[q.id] ?? null}
                  onSelectOption={() => undefined}
                  reviewMode
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
