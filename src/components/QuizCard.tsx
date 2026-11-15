import { CheckCircle2, RotateCcw, XCircle } from 'lucide-react';
import type { QuizQuestion } from '../types';

interface QuizCardProps {
  question: QuizQuestion;
  questionIndex: number;
  totalQuestions: number;
  selectedOptionIndex: number | null;
  onSelectOption: (optionIndex: number) => void;
  onRestartQuestion?: () => void;
  reviewMode?: boolean;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const;

export function QuizCard({
  question,
  questionIndex,
  totalQuestions,
  selectedOptionIndex,
  onSelectOption,
  onRestartQuestion,
  reviewMode = false,
}: QuizCardProps) {
  const hasAnswered = selectedOptionIndex !== null;
  const isCorrect = selectedOptionIndex === question.correctAnswerIndex;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <span className="font-mono tabular-nums text-[#4338CA] font-semibold">
            Question {questionIndex + 1} of {totalQuestions}
          </span>
          <span aria-hidden="true">·</span>
          <span>Difficulty: {question.difficulty}</span>
        </div>

        {hasAnswered && !reviewMode && onRestartQuestion && (
          <button
            type="button"
            onClick={onRestartQuestion}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-[#4338CA] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restart Question</span>
          </button>
        )}
      </div>

      <h3 className="font-display text-lg sm:text-xl font-bold text-[#1E1B4B] leading-snug">
        {question.question}
      </h3>

      <div className="space-y-3" role="radiogroup" aria-label={`Question ${questionIndex + 1} options`}>
        {question.options.map((option, idx) => {
          const isSelected = selectedOptionIndex === idx;
          const isOptionCorrect = idx === question.correctAnswerIndex;

          let containerClasses =
            'bg-white border-slate-200 hover:border-[#4338CA]/50 hover:bg-slate-50 text-[#1E1B4B]';
          let letterClasses = 'bg-slate-100 text-slate-700 border-slate-200';
          let statusLabel: string | null = null;

          if (hasAnswered || reviewMode) {
            if (isOptionCorrect) {
              containerClasses =
                'bg-[#10B981]/10 border-[#10B981] text-[#1E1B4B]';
              letterClasses = 'bg-[#10B981] text-white border-[#10B981]';
              statusLabel = 'Correct Answer';
            } else if (isSelected && !isOptionCorrect) {
              containerClasses =
                'bg-red-50 border-red-600 text-[#1E1B4B]';
              letterClasses = 'bg-red-600 text-white border-red-600';
              statusLabel = 'Your Answer (Incorrect)';
            } else {
              containerClasses = 'bg-slate-50/70 border-slate-200 text-slate-500';
              letterClasses = 'bg-slate-100 text-slate-400 border-slate-200';
            }
          }

          return (
            <button
              key={idx}
              type="button"
              disabled={hasAnswered || reviewMode}
              onClick={() => onSelectOption(idx)}
              className={`w-full text-left p-4 rounded-xl border transition-all duration-150 flex items-start justify-between gap-4 ${containerClasses} ${
                hasAnswered || reviewMode ? 'cursor-default' : 'cursor-pointer'
              } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4338CA]`}
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <span
                  className={`w-7 h-7 rounded-lg border text-xs font-mono font-semibold flex items-center justify-center shrink-0 mt-0.5 ${letterClasses}`}
                >
                  {OPTION_LETTERS[idx]}
                </span>
                <span className="text-sm sm:text-base leading-relaxed font-medium break-words">
                  {option}
                </span>
              </div>

              {statusLabel && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold shrink-0 mt-1">
                  {isOptionCorrect ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                      <span className="text-[#10B981] hidden sm:inline">{statusLabel}</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-red-600" />
                      <span className="text-red-600 hidden sm:inline">{statusLabel}</span>
                    </>
                  )}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {(hasAnswered || reviewMode) && (
        <div
          className={`p-4 sm:p-5 rounded-xl border ${
            isCorrect
              ? 'bg-[#10B981]/5 border-[#10B981]/30'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2 mb-1.5 text-sm font-semibold">
            {isCorrect ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                <span className="text-[#10B981]">Correct</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-red-600" />
                <span className="text-[#1E1B4B]">
                  {selectedOptionIndex === null
                    ? `Unanswered · Correct Option: ${OPTION_LETTERS[question.correctAnswerIndex]}`
                    : `Incorrect · Correct Option: ${OPTION_LETTERS[question.correctAnswerIndex]}`}
                </span>
              </>
            )}
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">{question.explanation}</p>
        </div>
      )}
    </div>
  );
}
