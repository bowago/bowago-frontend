"use client";
import { createContext, useContext, useCallback, useState, useEffect } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  success: (msg: string, duration?: number) => void;
  error:   (msg: string, duration?: number) => void;
  warning: (msg: string, duration?: number) => void;
  info:    (msg: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="w-5 h-5 flex-shrink-0" />,
  error:   <XCircle    className="w-5 h-5 flex-shrink-0" />,
  warning: <AlertTriangle className="w-5 h-5 flex-shrink-0" />,
  info:    <Info       className="w-5 h-5 flex-shrink-0" />,
};

const styles: Record<ToastType, string> = {
  success: "bg-white border-l-4 border-green-500 text-green-700",
  error:   "bg-white border-l-4 border-red-500   text-red-700",
  warning: "bg-white border-l-4 border-amber-500  text-amber-700",
  info:    "bg-white border-l-4 border-blue-500   text-blue-700",
};

const iconStyles: Record<ToastType, string> = {
  success: "text-green-500",
  error:   "text-red-500",
  warning: "text-amber-500",
  info:    "text-blue-500",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const add = useCallback((type: ToastType, message: string, duration = 4000) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev.slice(-4), { id, type, message, duration }]);
    if (duration > 0) setTimeout(() => remove(id), duration);
  }, [remove]);

  const ctx: ToastContextValue = {
    success: (m, d) => add("success", m, d),
    error:   (m, d) => add("error",   m, d),
    warning: (m, d) => add("warning", m, d),
    info:    (m, d) => add("info",    m, d),
  };

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      {/* Toast container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onRemove={remove} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  const handleRemove = () => {
    setVisible(false);
    setTimeout(() => onRemove(toast.id), 300);
  };

  return (
    <div
      className={`
        pointer-events-auto flex items-start gap-3 px-4 py-3.5 rounded-xl shadow-lg
        ${styles[toast.type]}
        transition-all duration-300 ease-out
        ${visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}
      `}
    >
      <span className={iconStyles[toast.type]}>{icons[toast.type]}</span>
      <p className="flex-1 text-sm font-medium leading-snug">{toast.message}</p>
      <button
        onClick={handleRemove}
        className="text-gray-400 hover:text-gray-600 transition-colors mt-0.5 flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}

// Singleton for use outside React (in apiSlice mutations)
let _toast: ToastContextValue | null = null;
export function setToastInstance(t: ToastContextValue) { _toast = t; }
export const toastSingleton = {
  success: (m: string) => _toast?.success(m),
  error:   (m: string) => _toast?.error(m),
  warning: (m: string) => _toast?.warning(m),
  info:    (m: string) => _toast?.info(m),
};
