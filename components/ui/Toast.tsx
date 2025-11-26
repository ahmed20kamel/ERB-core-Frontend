'use client';

import { useToast, removeToast } from '@/lib/hooks/use-toast';

export default function ToastContainer() {
  const { toasts } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 max-w-md">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`card shadow-md flex items-center justify-between gap-3 ${
            toast.type === 'success'
              ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
              : toast.type === 'error'
              ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
              : toast.type === 'warning'
              ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
              : 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          }`}
        >
          <p
            className={`text-sm font-medium flex-1 ${
              toast.type === 'success'
                ? 'text-green-800 dark:text-green-200'
                : toast.type === 'error'
                ? 'text-red-800 dark:text-red-200'
                : toast.type === 'warning'
                ? 'text-yellow-800 dark:text-yellow-200'
                : 'text-blue-800 dark:text-blue-200'
            }`}
          >
            {toast.message}
          </p>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-muted-foreground hover:text-foreground p-1"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
