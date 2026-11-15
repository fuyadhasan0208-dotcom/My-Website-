import React, { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  CalendarDays,
  Check,
  Clock,
  Copy,
  Download,
  ListChecks,
  Sparkles,
} from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { GeminiServiceError, generateStudyPlan } from '../services/geminiService';
import { storageService } from '../services/storageService';
import { copyToClipboard, downloadTextFile } from '../utils/export';
import { formatShortDate, sanitizeTextInput } from '../utils/sanitize';
import type {
  LearningLanguage,
  SavedStudyPlan,
  StudyPlanResponse,
} from '../types';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { ErrorBanner } from '../components/ErrorBanner';

const LANGUAGES: LearningLanguage[] = ['Bangla', 'English', 'Mixed Bangla-English'];

function getDefaultExamDate(): string {
  const future = new Date();
  future.setDate(future.getDate() + 45);
  return future.toISOString().split('T')[0];
}

export function StudyPlanner() {
  const { settings, showToast } = useAppContext();

  const [studentName, setStudentName] = useState('');
  const [examName, setExamName] = useState('');
  const [subjectsInput, setSubjectsInput] = useState('Physics, Chemistry, Higher Math, English');
  const [weakSubjectsInput, setWeakSubjectsInput] = useState('Physics, Higher Math');
  const [dailyHours, setDailyHours] = useState(5);
  const [examDate, setExamDate] = useState(getDefaultExamDate);
  const [language, setLanguage] = useState<LearningLanguage>(settings.preferredLanguage);

  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<StudyPlanResponse | null>(null);
  const [viewMode, setViewMode] = useState<'structured' | 'markdown'>('structured');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<{
    message: string;
    needsConfiguration?: boolean;
  } | null>(null);

  const [savedPlans, setSavedPlans] = useState<SavedStudyPlan[]>(() =>
    storageService.getStudyPlans()
  );

  const parseCommaList = (raw: string): string[] =>
    raw
      .split(',')
      .map((s) => sanitizeTextInput(s, 80))
      .filter(Boolean);

  const handleGeneratePlan = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const cleanExam = sanitizeTextInput(examName, 160);
    const subjects = parseCommaList(subjectsInput);
    const weakSubjects = parseCommaList(weakSubjectsInput);

    if (!cleanExam) {
      setError({ message: 'Please enter the examination name (e.g., HSC 2027, BUET Admission).' });
      return;
    }
    if (subjects.length === 0) {
      setError({ message: 'Please enter at least one subject separated by commas.' });
      return;
    }

    setLoading(true);
    setError(null);

    const request = {
      studentName: sanitizeTextInput(studentName, 100) || undefined,
      examName: cleanExam,
      subjects,
      dailyHours,
      examDate,
      weakSubjects,
      language,
    };

    try {
      const result = await generateStudyPlan(request, settings);
      setPlan(result.plan);
      const saved: SavedStudyPlan = {
        id: `plan-${Date.now()}`,
        request,
        plan: result.plan,
        createdAt: new Date().toISOString(),
      };
      setSavedPlans(storageService.saveStudyPlan(saved));
      showToast({
        type: 'success',
        title: 'Study plan created',
        description: `Personalized schedule for ${cleanExam} is ready.`,
      });
    } catch (err) {
      if (err instanceof GeminiServiceError) {
        setError({
          message: err.message,
          needsConfiguration: err.needsConfiguration,
        });
      } else {
        setError({ message: 'Could not generate study plan. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const buildPlainTextPlan = (): string => {
    if (!plan) return '';
    return plan.markdownPlan;
  };

  const handleCopyPlan = async () => {
    const text = buildPlainTextPlan();
    if (!text) return;
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      showToast({ type: 'success', title: 'Study plan copied to clipboard' });
      window.setTimeout(() => setCopied(false), 1800);
    }
  };

  const handleDownloadPlan = () => {
    const text = buildPlainTextPlan();
    if (!text) return;
    downloadTextFile(`EduGenius_StudyPlan_${examName || 'Schedule'}.txt`, text);
    showToast({ type: 'success', title: 'Downloaded study plan (.txt)' });
  };

  const handleLoadSaved = (saved: SavedStudyPlan) => {
    setStudentName(saved.request.studentName ?? '');
    setExamName(saved.request.examName);
    setSubjectsInput(saved.request.subjects.join(', '));
    setWeakSubjectsInput(saved.request.weakSubjects.join(', '));
    setDailyHours(saved.request.dailyHours);
    setExamDate(saved.request.examDate);
    setLanguage(saved.request.language);
    setPlan(saved.plan);
    setError(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <div className="mb-8 space-y-2">
        <p className="text-xs font-semibold text-[#4338CA]">AI Study Planner</p>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#1E1B4B] tracking-tight">
          Personalized Exam Routine &amp; Time Allocation
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl">
          Build a realistic daily routine balancing strong subjects, weak areas, spaced revision,
          breaks, and mock practice tests leading up to your exam date.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Form Panel */}
        <div className="lg:col-span-4 space-y-6">
          <form
            onSubmit={handleGeneratePlan}
            className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4"
          >
            <div>
              <label
                htmlFor="planner-name"
                className="block text-xs font-semibold text-[#1E1B4B] mb-1.5"
              >
                Student Name (optional)
              </label>
              <input
                id="planner-name"
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="e.g., Rafiqul Islam"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-[#F8FAFC] text-[#1E1B4B] focus:outline-none focus:ring-2 focus:ring-[#4338CA] focus:bg-white"
              />
            </div>

            <div>
              <label
                htmlFor="planner-exam"
                className="block text-xs font-semibold text-[#1E1B4B] mb-1.5"
              >
                Examination Name
              </label>
              <input
                id="planner-exam"
                type="text"
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                placeholder="e.g., HSC Final Exam, Medical Admission, BCS"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-[#F8FAFC] text-[#1E1B4B] focus:outline-none focus:ring-2 focus:ring-[#4338CA] focus:bg-white"
              />
            </div>

            <div>
              <label
                htmlFor="planner-subjects"
                className="block text-xs font-semibold text-[#1E1B4B] mb-1.5"
              >
                Subjects (comma-separated)
              </label>
              <textarea
                id="planner-subjects"
                rows={2}
                value={subjectsInput}
                onChange={(e) => setSubjectsInput(e.target.value)}
                placeholder="Physics, Chemistry, Math, Biology, English"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-[#F8FAFC] text-[#1E1B4B] focus:outline-none focus:ring-2 focus:ring-[#4338CA] focus:bg-white"
              />
            </div>

            <div>
              <label
                htmlFor="planner-weak"
                className="block text-xs font-semibold text-[#1E1B4B] mb-1.5"
              >
                Weak / Priority Subjects (comma-separated)
              </label>
              <input
                id="planner-weak"
                type="text"
                value={weakSubjectsInput}
                onChange={(e) => setWeakSubjectsInput(e.target.value)}
                placeholder="e.g., Physics, Organic Chemistry"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-[#F8FAFC] text-[#1E1B4B] focus:outline-none focus:ring-2 focus:ring-[#4338CA] focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="planner-hours"
                  className="block text-xs font-semibold text-[#1E1B4B] mb-1.5"
                >
                  Daily Hours ({dailyHours}h)
                </label>
                <input
                  id="planner-hours"
                  type="range"
                  min={1}
                  max={14}
                  step={1}
                  value={dailyHours}
                  onChange={(e) => setDailyHours(Number(e.target.value))}
                  className="w-full accent-[#4338CA] mt-2 cursor-pointer"
                />
              </div>

              <div>
                <label
                  htmlFor="planner-date"
                  className="block text-xs font-semibold text-[#1E1B4B] mb-1.5"
                >
                  Exam Date
                </label>
                <input
                  id="planner-date"
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-[#F8FAFC] text-[#1E1B4B] focus:outline-none focus:ring-2 focus:ring-[#4338CA]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="planner-language"
                className="block text-xs font-semibold text-[#1E1B4B] mb-1.5"
              >
                Preferred Language
              </label>
              <select
                id="planner-language"
                value={language}
                onChange={(e) => setLanguage(e.target.value as LearningLanguage)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-[#F8FAFC] text-[#1E1B4B] focus:outline-none focus:ring-2 focus:ring-[#4338CA]"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-[#4338CA] hover:bg-[#3730A3] disabled:opacity-60 rounded-xl transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loading ? 'Building Routine...' : 'Generate Study Plan'}</span>
            </button>
          </form>

          {savedPlans.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <h2 className="font-display text-sm font-bold text-[#1E1B4B]">Saved Plans</h2>
              <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                {savedPlans.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleLoadSaved(item)}
                    className="w-full text-left p-3 rounded-xl bg-[#F8FAFC] border border-slate-200 hover:border-[#4338CA]/40 transition-colors cursor-pointer"
                  >
                    <p className="text-xs font-semibold text-[#1E1B4B] truncate">
                      {item.request.examName}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
                      {item.request.dailyHours}h/day · Exam {item.request.examDate} · Saved{' '}
                      {formatShortDate(item.createdAt)}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Output Panel */}
        <div className="lg:col-span-8 space-y-4">
          {error && (
            <ErrorBanner
              message={error.message}
              needsConfiguration={error.needsConfiguration}
              onRetry={() => void handleGeneratePlan()}
            />
          )}

          <div className="bg-white rounded-2xl border border-slate-200 min-h-[540px] flex flex-col">
            <div className="px-5 sm:px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setViewMode('structured')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    viewMode === 'structured'
                      ? 'bg-white text-[#1E1B4B] shadow-xs'
                      : 'text-slate-600 hover:text-[#1E1B4B]'
                  }`}
                >
                  Schedule View
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('markdown')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    viewMode === 'markdown'
                      ? 'bg-white text-[#1E1B4B] shadow-xs'
                      : 'text-slate-600 hover:text-[#1E1B4B]'
                  }`}
                >
                  Full Notes View
                </button>
              </div>

              {plan && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyPlan}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#1E1B4B] bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#10B981]" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Plan</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadPlan}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#1E1B4B] hover:bg-[#4338CA] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download (.txt)</span>
                  </button>
                </div>
              )}
            </div>

            <div className="p-5 sm:p-8 flex-1">
              {loading && (
                <LoadingIndicator
                  label="Designing your personalized daily routine, breaks, and revision cycles..."
                  lines={8}
                />
              )}

              {!loading && !plan && (
                <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center">
                    <CalendarDays className="w-6 h-6" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-[#1E1B4B]">
                    Create Your Custom Study Routine
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Fill in your exam details, daily available hours, and weak subjects on the
                    left to generate an actionable study timetable.
                  </p>
                </div>
              )}

              {!loading && plan && viewMode === 'markdown' && (
                <MarkdownRenderer content={plan.markdownPlan} />
              )}

              {!loading && plan && viewMode === 'structured' && (
                <div className="space-y-8">
                  <div className="p-4 sm:p-5 rounded-xl bg-[#F8FAFC] border border-slate-200">
                    <p className="text-xs font-semibold text-[#4338CA] mb-1">Strategy Overview</p>
                    <p className="text-sm sm:text-[15px] text-[#1E1B4B] leading-relaxed">
                      {plan.overview}
                    </p>
                  </div>

                  {/* Daily Study Schedule */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#4338CA]" />
                      <h3 className="font-display text-base font-bold text-[#1E1B4B]">
                        Daily Study Schedule
                      </h3>
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-slate-50 text-xs font-semibold text-[#1E1B4B]">
                          <tr>
                            <th className="px-4 py-3 border-b border-slate-200">Time Block</th>
                            <th className="px-4 py-3 border-b border-slate-200">Subject</th>
                            <th className="px-4 py-3 border-b border-slate-200">Activity</th>
                            <th className="px-4 py-3 border-b border-slate-200">Focus Tip</th>
                          </tr>
                        </thead>
                        <tbody>
                          {plan.dailySchedule.map((slot, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/80">
                              <td className="px-4 py-3 border-b border-slate-100 font-mono text-xs tabular-nums text-[#4338CA] whitespace-nowrap">
                                {slot.timeBlock}
                              </td>
                              <td className="px-4 py-3 border-b border-slate-100 font-semibold text-[#1E1B4B]">
                                {slot.subject}
                              </td>
                              <td className="px-4 py-3 border-b border-slate-100 text-slate-700">
                                {slot.activity}
                              </td>
                              <td className="px-4 py-3 border-b border-slate-100 text-xs text-slate-600">
                                {slot.focusTip}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Subject Allocation Chart + Cards */}
                  <div className="space-y-3">
                    <h3 className="font-display text-base font-bold text-[#1E1B4B]">
                      Subject-Wise Weekly Allocation (Hours/Week)
                    </h3>
                    <div className="h-56 w-full bg-[#F8FAFC] rounded-xl border border-slate-200 p-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={plan.subjectAllocation}
                          margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                          <XAxis dataKey="subject" tick={{ fontSize: 12 }} />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Bar
                            dataKey="hoursPerWeek"
                            name="Hours / Week"
                            fill="#4338CA"
                            radius={[6, 6, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {plan.subjectAllocation.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-xl border border-slate-200 bg-white space-y-1.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-sm text-[#1E1B4B]">
                              {item.subject}
                            </span>
                            <span className="text-xs font-mono tabular-nums text-[#4338CA] font-semibold">
                              {item.hoursPerWeek}h/wk · {item.priority}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {item.strategy}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Breaks, Revision, Practice Tests, Weekly Goals */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-slate-200 bg-[#F8FAFC] space-y-2">
                      <h4 className="font-display text-sm font-bold text-[#1E1B4B]">
                        Break Schedule
                      </h4>
                      <ul className="space-y-1.5 text-xs text-slate-700 list-disc pl-4">
                        {plan.breakSchedule.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 bg-[#F8FAFC] space-y-2">
                      <h4 className="font-display text-sm font-bold text-[#1E1B4B]">
                        Revision Sessions
                      </h4>
                      <ul className="space-y-1.5 text-xs text-slate-700 list-disc pl-4">
                        {plan.revisionSessions.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 bg-[#F8FAFC] space-y-2">
                      <h4 className="font-display text-sm font-bold text-[#1E1B4B]">
                        Practice Test Sessions
                      </h4>
                      <ul className="space-y-1.5 text-xs text-slate-700 list-disc pl-4">
                        {plan.practiceTests.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 rounded-xl border border-[#10B981]/30 bg-[#10B981]/5 space-y-2">
                      <div className="flex items-center gap-1.5">
                        <ListChecks className="w-4 h-4 text-[#10B981]" />
                        <h4 className="font-display text-sm font-bold text-[#1E1B4B]">
                          Weekly Progress Goals
                        </h4>
                      </div>
                      <ul className="space-y-1.5 text-xs text-slate-700 list-disc pl-4">
                        {plan.weeklyGoals.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
