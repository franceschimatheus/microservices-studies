import React, { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2 w-full">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {label}
        </label>
        <input
          ref={ref}
          className={`bg-slate-900 border ${
            error ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-800 focus:border-red-500 focus:ring-red-500/15'
          } rounded-xl px-4 py-3.5 text-white font-sans text-sm outline-none transition-all focus:ring-4 ${className}`}
          {...props}
        />
        {error && <span className="text-xs text-red-500 mt-1 font-medium">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
