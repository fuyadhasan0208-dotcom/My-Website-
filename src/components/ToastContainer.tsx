import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

export function ToastContainer() {
  const { toasts, dismissToast } = useAppContext();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full px-4 sm:px-0 pointer-events-none"
    >
      {toasts.map((toast) => {
        const icon =
          toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0" />
          ) : toast.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          ) : (
            <Info className="w-5 h-5 text-[#4338CA] shrink-0" />
          );

        return (
          <div
            key={toast.id}
            className="pointer-events-auto bg-white border border-slate-200 shadow-lg rounded-xl p-4 flex items-start gap-3"
          >
            {icon}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#1E1B4B]">{toast.title}</p>
              {toast.description && (
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  {toast.description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
