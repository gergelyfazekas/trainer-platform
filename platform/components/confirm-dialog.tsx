"use client";

interface ConfirmDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ message, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
      <div
        className="relative bg-white rounded-2xl shadow-xl border border-[var(--th-border)] w-full max-w-sm p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-[var(--th-fg)] text-[15px]">Csomag törlése</p>
            <p className="text-[13.5px] text-[var(--th-fg-muted)] mt-1 leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-[var(--th-fg)] bg-white border border-[var(--th-border)] rounded-full hover:bg-[var(--th-muted)] transition-all"
          >
            Mégse
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-full transition-all"
          >
            Törlés
          </button>
        </div>
      </div>
    </div>
  );
}
