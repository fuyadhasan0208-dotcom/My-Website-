interface LoadingIndicatorProps {
  label?: string;
  lines?: number;
  compact?: boolean;
}

export function LoadingIndicator({
  label = 'Generating response with Gemini AI...',
  lines = 5,
  compact = false,
}: LoadingIndicatorProps) {
  if (compact) {
    return (
      <div className="inline-flex items-center gap-2.5 text-sm text-[#4338CA] font-medium">
        <span
          className="w-4 h-4 rounded-full border-2 border-[#4338CA]/25 border-t-[#4338CA] animate-spin"
          aria-hidden="true"
        />
        <span>{label}</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-2" role="status" aria-live="polite">
      <div className="flex items-center gap-2.5 text-sm font-medium text-[#4338CA]">
        <span
          className="w-4 h-4 rounded-full border-2 border-[#4338CA]/25 border-t-[#4338CA] animate-spin"
          aria-hidden="true"
        />
        <span>{label}</span>
      </div>
      <div className="space-y-2.5 animate-pulse">
        {Array.from({ length: lines }).map((_, idx) => (
          <div
            key={idx}
            className="h-3.5 bg-slate-200/80 rounded"
            style={{ width: `${idx === lines - 1 ? 64 : idx % 2 === 0 ? 96 : 84}%` }}
          />
        ))}
      </div>
    </div>
  );
}
