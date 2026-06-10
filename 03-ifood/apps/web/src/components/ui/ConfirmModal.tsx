'use client';

import React from 'react';
import { AlertTriangle, Info, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'info',
  loading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: <AlertTriangle className="w-6 h-6 text-red-500" />,
      iconBg: 'bg-red-950/40 border-red-900/30',
      confirmBtn: 'bg-red-600 hover:bg-red-700 focus:ring-red-500/30',
    },
    warning: {
      icon: <AlertTriangle className="w-6 h-6 text-amber-500" />,
      iconBg: 'bg-amber-950/40 border-amber-900/30',
      confirmBtn: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500/30',
    },
    info: {
      icon: <Info className="w-6 h-6 text-sky-400" />,
      iconBg: 'bg-sky-950/40 border-sky-900/30',
      confirmBtn: 'bg-red-650 hover:bg-red-700 focus:ring-red-500/30',
    },
  };

  const style = variantStyles[variant];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-8 animate-in fade-in zoom-in duration-200"
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center mb-5 ${style.iconBg}`}>
            {style.icon}
          </div>

          <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
          <p className="text-slate-400 text-sm leading-relaxed mb-8 whitespace-pre-line max-w-sm">
            {message}
          </p>

          <div className="flex gap-3 w-full">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-slate-850 hover:bg-slate-800 text-white font-bold py-3 px-6 rounded-xl transition-all cursor-pointer text-center text-sm disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 text-white font-bold py-3 px-6 rounded-xl transition-all cursor-pointer text-center text-sm focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed ${style.confirmBtn}`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </span>
              ) : (
                confirmLabel
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
