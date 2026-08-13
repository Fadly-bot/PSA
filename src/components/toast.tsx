'use client';

import { useCallback, useRef, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info';
export type ToastState = { type: ToastType; message: string } | null;

/**
 * Toast state hook — same pattern as BorrowButton (`.toast` styles in
 * globals.css). Error toasts stay on screen longer so longer messages
 * (e.g. delete-rejection hints) remain readable.
 */
export function useToast() {
  const [toast, setToast] = useState<ToastState>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((t: ToastState) => {
    if (timer.current) clearTimeout(timer.current);
    setToast(t);
    if (t) {
      const ms = t.type === 'error' ? 6000 : 4000;
      timer.current = setTimeout(() => setToast(null), ms);
    }
  }, []);

  return { toast, showToast };
}

export default function Toast({ toast }: { toast: ToastState }) {
  if (!toast) return null;
  return (
    <div className={`toast ${toast.type}`} role={toast.type === 'error' ? 'alert' : 'status'}>
      {toast.message}
    </div>
  );
}
