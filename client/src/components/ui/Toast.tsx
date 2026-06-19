export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error';
}

interface ToastProps {
  toasts: ToastItem[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastProps) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-full max-w-sm px-4" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl shadow-lg text-white text-lg font-medium ${
            t.type === 'success' ? 'bg-green-600' : 'bg-red-500'
          }`}
          role="alert"
        >
          <span>{t.message}</span>
          <button onClick={() => onRemove(t.id)} className="shrink-0 opacity-80 hover:opacity-100" aria-label="Dismiss">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
