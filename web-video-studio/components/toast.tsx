"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════════════════ */

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
  /** phase controls the enter/exit transition */
  phase: "enter" | "idle" | "exit";
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Context
   ═══════════════════════════════════════════════════════════════════════════ */

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 0;
const MAX_VISIBLE = 5;
const DURATION_MS = 4_000;

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Return a no-op so callers never crash when the provider is missing.
    // In production the layout always renders ToastContainer (which provides the
    // context), but standalone component usage / storybooks / tests are safe.
    return { toast: () => {} };
  }
  return ctx;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Container (renders the toast stack + provides context)
   ═══════════════════════════════════════════════════════════════════════════ */

export function ToastContainer({ children }: { children?: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  /* ── Remove a toast (triggers exit animation first) ───────────────────── */
  const removeToast = useCallback((id: number) => {
    // Cancel any pending timer for this toast
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }

    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, phase: "exit" as const } : t)));

    // After the exit animation finishes, remove from DOM
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 350);
  }, []);

  /* ── Add a toast ──────────────────────────────────────────────────────── */
  const addToast = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = nextId++;

      setToasts((prev) => {
        // Evict oldest idle/enter toasts if we are at capacity.
        // We only count toasts that are NOT already exiting.
        const active = prev.filter((t) => t.phase !== "exit");
        let trimmed = prev;
        while (active.length >= MAX_VISIBLE) {
          const oldest = active.shift()!;
          trimmed = trimmed.filter((t) => t.id !== oldest.id);
        }
        return [...trimmed, { id, message, type, phase: "enter" as const }];
      });

      // Auto-dismiss timer
      const timer = setTimeout(() => removeToast(id), DURATION_MS);
      timersRef.current.set(id, timer);

      // Transition enter → idle after a frame so CSS picks up the enter class
      requestAnimationFrame(() => {
        setToasts((prev) =>
          prev.map((t) => (t.id === id ? { ...t, phase: "idle" as const } : t)),
        );
      });
    },
    [removeToast],
  );

  /* ── Cleanup timers on unmount ────────────────────────────────────────── */
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  /* ── Border colour map ────────────────────────────────────────────────── */
  const borderClass: Record<ToastType, string> = {
    success: "border-l-[#4ade80]",
    error: "border-l-[#f87171]",
    info: "border-l-brand",
  };

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}

      {/* Toast stack — fixed bottom-right */}
      <div
        aria-live="polite"
        aria-label="Notifications"
        className="pointer-events-none fixed bottom-6 right-6 z-[100] flex flex-col-reverse gap-2"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`
              pointer-events-auto flex max-w-sm items-center gap-3 rounded-lg border
              border-bd bg-modal px-4 py-3 text-sm text-t1 shadow-lg
              backdrop-blur-sm transition-all duration-300 ease-out
              ${borderClass[t.type]}
              ${t.phase === "enter" ? "translate-x-4 opacity-0" : ""}
              ${t.phase === "exit" ? "translate-x-4 opacity-0" : ""}
            `}
          >
            {/* Icon */}
            <span className="shrink-0 text-base leading-none">
              {t.type === "success" && (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <circle cx="8" cy="8" r="7" stroke="#4ade80" strokeWidth="1.5" />
                  <path d="M5 8l2 2 4-4" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              {t.type === "error" && (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <circle cx="8" cy="8" r="7" stroke="#f87171" strokeWidth="1.5" />
                  <path d="M8 5v3.5" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="8" cy="11.25" r="0.75" fill="#f87171" />
                </svg>
              )}
              {t.type === "info" && (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <circle cx="8" cy="8" r="7" stroke="#d97706" strokeWidth="1.5" />
                  <path d="M8 7.5v4" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="8" cy="5.25" r="0.75" fill="#d97706" />
                </svg>
              )}
            </span>

            {/* Message */}
            <span className="flex-1 leading-snug">{t.message}</span>

            {/* Dismiss button */}
            <button
              onClick={() => removeToast(t.id)}
              className="shrink-0 rounded p-0.5 text-t3 transition-colors hover:text-t1"
              aria-label="Dismiss"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
