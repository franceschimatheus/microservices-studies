'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertTriangle, Info, Bell } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  title?: string;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'info', title?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, title }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-24 right-8 z-50 flex flex-col gap-3 max-w-md w-full pointer-events-none">
        {toasts.map((t) => {
          let Icon = Bell;
          let colorClass = 'text-red-500 border-red-500/25 bg-red-950/20';
          
          if (t.type === 'success') {
            Icon = CheckCircle;
            colorClass = 'text-emerald-400 border-emerald-500/25 bg-emerald-950/20';
          } else if (t.type === 'warning') {
            Icon = AlertTriangle;
            colorClass = 'text-amber-400 border-amber-500/25 bg-amber-950/20';
          } else if (t.type === 'info') {
            Icon = Info;
            colorClass = 'text-sky-400 border-sky-500/25 bg-sky-950/20';
          }

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3.5 p-4 rounded-2xl border backdrop-blur-xl shadow-2xl transition-all duration-300 animate-slide-in ${colorClass}`}
              role="alert"
            >
              <div className="flex-shrink-0 mt-0.5">
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                {t.title && (
                  <h4 className="font-extrabold text-sm text-slate-100 tracking-tight mb-0.5">
                    {t.title}
                  </h4>
                )}
                <p className="text-slate-300 text-xs font-medium leading-relaxed">
                  {t.message}
                </p>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="flex-shrink-0 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
