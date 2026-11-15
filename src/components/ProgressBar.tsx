interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
}

export function ProgressBar({ current, total, label }: ProgressBarProps) {
  const safeTotal = Math.max(1, total);
  const percent = Math.min(100, Math.max(0, Math.round((current / safeTotal) * 100)));

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs font-medium text-slate-600">
        <span>{label ?? `Progress`}</span>
        <span className="font-mono tabular-nums text-[#1E1B4B]">
          {current} / {total} ({percent}%)
        </span>
      </div>
      <div
        className="w-full h-2 bg-slate-200 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full bg-[#4338CA] transition-all duration-300 ease-out rounded-full"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
