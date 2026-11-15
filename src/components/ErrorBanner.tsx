import { AlertCircle, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ErrorBannerProps {
  message: string;
  needsConfiguration?: boolean;
  onRetry?: () => void;
}

export function ErrorBanner({
  message,
  needsConfiguration = false,
  onRetry,
}: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="rounded-xl bg-red-50 border border-red-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-red-900">AI Request Could Not Complete</p>
          <p className="text-sm text-red-800 leading-relaxed">{message}</p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 shrink-0 pl-8 sm:pl-0">
        {needsConfiguration && (
          <Link
            to="/settings"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#4338CA] hover:bg-[#3730A3] rounded-lg transition-colors whitespace-nowrap"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Open Settings</span>
          </Link>
        )}
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="px-3.5 py-2 text-xs font-semibold text-red-900 bg-white border border-red-200 hover:bg-red-100 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}
