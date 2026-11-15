import { AlertTriangle } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

export function ConfirmModal() {
  const { activeConfirm, closeConfirm } = useAppContext();

  if (!activeConfirm) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E1B4B]/45 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-5">
        <div className="flex items-start gap-3.5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              activeConfirm.destructive
                ? 'bg-red-50 text-red-600'
                : 'bg-[#4338CA]/10 text-[#4338CA]'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1.5">
            <h2
              id="confirm-modal-title"
              className="font-display text-lg font-bold text-[#1E1B4B]"
            >
              {activeConfirm.title}
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              {activeConfirm.description}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={closeConfirm}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              activeConfirm.onConfirm();
              closeConfirm();
            }}
            className={`px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors cursor-pointer ${
              activeConfirm.destructive
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-[#4338CA] hover:bg-[#3730A3]'
            }`}
          >
            {activeConfirm.confirmLabel ?? 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
