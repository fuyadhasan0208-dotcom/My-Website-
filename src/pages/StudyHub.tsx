import React, { useState } from 'react';
import {
  BookOpen,
  Check,
  Copy,
  Download,
  Layers,
  RefreshCw,
  RotateCw,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import {
  explainTopic,
  GeminiServiceError,
  generateFlashcards,
} from '../services/geminiService';
import { storageService } from '../services/storageService';
import { copyToClipboard, downloadTextFile } from '../utils/export';
import { formatShortDate, sanitizeTextInput } from '../utils/sanitize';
import type {
  ExplanationStyle,
  FlashcardItem,
  LearningLanguage,
  SavedStudyNote,
  StudentLevel,
  SubjectOption,
} from '../types';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
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

const STYLES: ExplanationStyle[] = [
  'Simple Summary',
  'Detailed Explanation with Examples',
  'Flashcard Points',
];

const LANGUAGES: LearningLanguage[] = ['Bangla', 'English', 'Mixed Bangla-English'];

export function StudyHub() {
  const { settings, showToast } = useAppContext();

  const [subject, setSubject] = useState<SubjectOption>('Physics');
  const [level, setLevel] = useState<StudentLevel>(settings.defaultLevel);
  const [topic, setTopic] = useState('');
  const [style, setStyle] = useState<ExplanationStyle>('Detailed Explanation with Examples');
  const [language, setLanguage] = useState<LearningLanguage>(settings.preferredLanguage);

  const [loading, setLoading] = useState(false);
  const [flashcardsLoading, setFlashcardsLoading] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [usedModel, setUsedModel] = useState<string | null>(null);
  const [flashcards, setFlashcards] = useState<FlashcardItem[]>([]);
  const [flippedCardIds, setFlippedCardIds] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'notes' | 'flashcards'>('notes');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<{
    message: string;
    needsConfiguration?: boolean;
  } | null>(null);

  const [savedNotes, setSavedNotes] = useState<SavedStudyNote[]>(() =>
    storageService.getStudyNotes()
  );

  const handleExplain = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const cleanTopic = sanitizeTextInput(topic, 2500);
    if (!cleanTopic) {
      setError({ message: 'Please enter a topic or concept you would like explained.' });
      return;
    }

    setLoading(true);
    setError(null);
    setActiveTab('notes');
    setFlashcards([]);

    try {
      const result = await explainTopic(
        {
          subject,
          level,
          topic: cleanTopic,
          style,
          language,
        },
        settings
      );

      setExplanation(result.explanation);
      setUsedModel(result.model);

      const note: SavedStudyNote = {
        id: `note-${Date.now()}`,
        subject,
        level,
        topic: cleanTopic,
        style,
        language,
        content: result.explanation,
        createdAt: new Date().toISOString(),
      };
      setActiveNoteId(note.id);
      setSavedNotes(storageService.saveStudyNote(note));
    } catch (err) {
      if (err instanceof GeminiServiceError) {
        setError({
          message: err.message,
          needsConfiguration: err.needsConfiguration,
        });
      } else {
        setError({ message: 'Failed to generate explanation. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFlashcards = async () => {
    const cleanTopic = sanitizeTextInput(topic, 2000);
    if (!cleanTopic) {
      showToast({
        type: 'error',
        title: 'Topic required',
        description: 'Enter a topic first to generate active-recall flashcards.',
      });
      return;
    }

    setFlashcardsLoading(true);
    setError(null);

    try {
      const result = await generateFlashcards(
        {
          subject,
          level,
          topic: cleanTopic,
          style,
          language,
        },
        settings
      );
      setFlashcards(result.flashcards);
      setFlippedCardIds({});
      setActiveTab('flashcards');

      if (activeNoteId && explanation) {
        const updated = storageService.saveStudyNote({
          id: activeNoteId,
          subject,
          level,
          topic: cleanTopic,
          style,
          language,
          content: explanation,
          flashcards: result.flashcards,
          createdAt: new Date().toISOString(),
        });
        setSavedNotes(updated);
      }

      showToast({
        type: 'success',
        title: 'Flashcards ready',
        description: `Created ${result.flashcards.length} active-recall cards.`,
      });
    } catch (err) {
      if (err instanceof GeminiServiceError) {
        setError({
          message: err.message,
          needsConfiguration: err.needsConfiguration,
        });
      } else {
        setError({ message: 'Could not generate flashcards right now.' });
      }
    } finally {
      setFlashcardsLoading(false);
    }
  };

  const handleCopyNotes = async () => {
    if (!explanation) return;
    const ok = await copyToClipboard(explanation);
    if (ok) {
      setCopied(true);
      showToast({ type: 'success', title: 'Notes copied to clipboard' });
      window.setTimeout(() => setCopied(false), 1800);
    }
  };

  const handleDownloadNotes = () => {
    if (!explanation) return;
    const header = `EduGenius AI — Study Notes\nSubject: ${subject}\nLevel: ${level}\nTopic: ${topic}\nLanguage: ${language}\n----------------------------------------\n\n`;
    downloadTextFile(`EduGenius_${subject}_Notes.txt`, header + explanation);
    showToast({ type: 'success', title: 'Downloaded study notes (.txt)' });
  };

  const handleLoadSavedNote = (note: SavedStudyNote) => {
    setSubject(note.subject);
    setLevel(note.level);
    setTopic(note.topic);
    setStyle(note.style);
    setLanguage(note.language);
    setExplanation(note.content);
    setActiveNoteId(note.id);
    setFlashcards(note.flashcards ?? []);
    setFlippedCardIds({});
    setActiveTab('notes');
    setError(null);
  };

  const handleDeleteNote = (id: string) => {
    setSavedNotes(storageService.deleteStudyNote(id));
    if (activeNoteId === id) {
      setActiveNoteId(null);
    }
  };

  const toggleFlip = (id: string) => {
    setFlippedCardIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <div className="mb-8 space-y-2">
        <p className="text-xs font-semibold text-[#4338CA]">AI Study Hub</p>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#1E1B4B] tracking-tight">
          Topic Explainer &amp; Active Recall Notes
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl">
          Break down challenging concepts into step-by-step explanations, formulas, code examples,
          and interactive flashcards tailored to your academic level.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Control Form */}
        <div className="lg:col-span-4 space-y-6">
          <form
            onSubmit={handleExplain}
            className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4"
          >
            <div>
              <label
                htmlFor="study-subject"
                className="block text-xs font-semibold text-[#1E1B4B] mb-1.5"
              >
                Subject
              </label>
              <select
                id="study-subject"
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
                htmlFor="study-level"
                className="block text-xs font-semibold text-[#1E1B4B] mb-1.5"
              >
                Student Level
              </label>
              <select
                id="study-level"
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

            <div>
              <span className="block text-xs font-semibold text-[#1E1B4B] mb-1.5">
                Explanation Style
              </span>
              <div className="grid grid-cols-1 gap-2">
                {STYLES.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setStyle(item)}
                    className={`px-3.5 py-2 text-left text-xs font-medium rounded-xl border transition-colors cursor-pointer ${
                      style === item
                        ? 'bg-[#4338CA]/10 border-[#4338CA] text-[#4338CA] font-semibold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="study-language"
                className="block text-xs font-semibold text-[#1E1B4B] mb-1.5"
              >
                Language
              </label>
              <select
                id="study-language"
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

            <div>
              <label
                htmlFor="study-topic"
                className="block text-xs font-semibold text-[#1E1B4B] mb-1.5"
              >
                Topic or Concept
              </label>
              <textarea
                id="study-topic"
                rows={4}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Ohm's Law and series/parallel circuits, Binary Search in Python, or নিউটনের মহাকর্ষ সূত্র..."
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-[#F8FAFC] text-[#1E1B4B] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4338CA] focus:bg-white resize-y"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-[#4338CA] hover:bg-[#3730A3] disabled:opacity-60 rounded-xl transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loading ? 'Generating Notes...' : 'Explain with AI'}</span>
            </button>
          </form>

          {/* Saved Study History */}
          {savedNotes.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <h2 className="font-display text-sm font-bold text-[#1E1B4B]">
                Recent Study Notes
              </h2>
              <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                {savedNotes.map((note) => (
                  <div
                    key={note.id}
                    className={`group flex items-start justify-between gap-2 p-2.5 rounded-xl border transition-colors ${
                      activeNoteId === note.id
                        ? 'bg-[#4338CA]/5 border-[#4338CA]/40'
                        : 'bg-[#F8FAFC] border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleLoadSavedNote(note)}
                      className="text-left min-w-0 flex-1 cursor-pointer"
                    >
                      <p className="text-xs font-semibold text-[#1E1B4B] truncate">
                        {note.topic}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {note.subject} · {formatShortDate(note.createdAt)}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteNote(note.id)}
                      aria-label={`Delete note ${note.topic}`}
                      className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Output Workspace */}
        <div className="lg:col-span-8 space-y-4">
          {error && (
            <ErrorBanner
              message={error.message}
              needsConfiguration={error.needsConfiguration}
              onRetry={() => void handleExplain()}
            />
          )}

          <div className="bg-white rounded-2xl border border-slate-200 min-h-[520px] flex flex-col">
            {/* Toolbar */}
            <div className="px-5 sm:px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setActiveTab('notes')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === 'notes'
                      ? 'bg-white text-[#1E1B4B] shadow-xs'
                      : 'text-slate-600 hover:text-[#1E1B4B]'
                  }`}
                >
                  Study Notes
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('flashcards')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === 'flashcards'
                      ? 'bg-white text-[#1E1B4B] shadow-xs'
                      : 'text-slate-600 hover:text-[#1E1B4B]'
                  }`}
                >
                  Flashcards {flashcards.length > 0 ? `(${flashcards.length})` : ''}
                </button>
              </div>

              {explanation && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyNotes}
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
                        <span>Copy Notes</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadNotes}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#1E1B4B] bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download (.txt)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleGenerateFlashcards}
                    disabled={flashcardsLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-60 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>{flashcardsLoading ? 'Creating...' : 'Generate Flashcards'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleExplain()}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#4338CA] bg-[#4338CA]/10 hover:bg-[#4338CA]/15 disabled:opacity-60 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Explain Again</span>
                  </button>
                </div>
              )}
            </div>

            {/* Body */}
            <div className="p-5 sm:p-8 flex-1">
              {loading && (
                <LoadingIndicator
                  label="Analyzing your topic and structuring step-by-step study notes..."
                  lines={8}
                />
              )}

              {!loading && activeTab === 'notes' && !explanation && (
                <div className="h-full min-h-[380px] flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-[#1E1B4B]">
                    Ready to Explain Any Topic
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Choose your subject, student level, and language on the left, then enter any
                    concept to get clear step-by-step study notes with examples and formulas.
                  </p>
                </div>
              )}

              {!loading && activeTab === 'notes' && explanation && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 pb-3 border-b border-slate-100">
                    <span className="font-semibold text-[#1E1B4B]">{subject}</span>
                    <span aria-hidden="true">·</span>
                    <span>{level}</span>
                    <span aria-hidden="true">·</span>
                    <span>{style}</span>
                    <span aria-hidden="true">·</span>
                    <span>{language}</span>
                    {usedModel && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono">{usedModel}</span>
                      </>
                    )}
                  </div>
                  <MarkdownRenderer content={explanation} />
                </div>
              )}

              {!loading && activeTab === 'flashcards' && (
                <div>
                  {flashcardsLoading ? (
                    <LoadingIndicator
                      label="Building active-recall flashcards for your topic..."
                      lines={5}
                    />
                  ) : flashcards.length === 0 ? (
                    <div className="h-full min-h-[360px] flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#7C3AED]/10 text-[#7C3AED] flex items-center justify-center">
                        <Layers className="w-6 h-6" />
                      </div>
                      <h3 className="font-display text-lg font-bold text-[#1E1B4B]">
                        No Flashcards Yet
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        Click &ldquo;Generate Flashcards&rdquo; above after explaining a topic to
                        turn key concepts into interactive flip cards.
                      </p>
                      <button
                        type="button"
                        onClick={handleGenerateFlashcards}
                        disabled={!topic.trim()}
                        className="px-4 py-2 text-xs font-semibold text-white bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
                      >
                        Generate Flashcards Now
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-xs text-slate-500">
                        Click any flashcard to flip between question and answer.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {flashcards.map((card, index) => {
                          const isFlipped = Boolean(flippedCardIds[card.id]);
                          return (
                            <button
                              key={card.id}
                              type="button"
                              onClick={() => toggleFlip(card.id)}
                              className={`text-left p-5 rounded-xl border min-h-[170px] flex flex-col justify-between transition-colors cursor-pointer ${
                                isFlipped
                                  ? 'bg-[#1E1B4B] text-white border-[#1E1B4B]'
                                  : 'bg-[#F8FAFC] text-[#1E1B4B] border-slate-200 hover:border-[#4338CA]/50'
                              }`}
                            >
                              <div className="flex items-center justify-between text-xs mb-2">
                                <span
                                  className={`font-mono font-semibold ${
                                    isFlipped ? 'text-[#10B981]' : 'text-[#4338CA]'
                                  }`}
                                >
                                  Card {index + 1} · {isFlipped ? 'Answer' : 'Prompt'}
                                </span>
                                <RotateCw className="w-3.5 h-3.5 opacity-70" />
                              </div>

                              <p className="text-sm sm:text-base font-medium leading-relaxed">
                                {isFlipped ? card.back : card.front}
                              </p>

                              {!isFlipped && card.hint ? (
                                <p className="text-xs text-slate-500 mt-3 pt-2 border-t border-slate-200/80">
                                  Hint: {card.hint}
                                </p>
                              ) : (
                                <p className="text-[11px] opacity-70 mt-3">
                                  Click to flip back
                                </p>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
