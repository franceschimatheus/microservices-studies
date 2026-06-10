import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hoverable?: boolean;
}

export function Card({ children, className = '', hoverable = false, ...props }: CardProps) {
  return (
    <div
      className={`bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl transition-all duration-300 ${
        hoverable ? 'hover:border-slate-700/80 hover:bg-slate-900/90 hover:scale-[1.01] hover:shadow-2xl' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`mb-4 flex justify-between items-center ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`text-slate-300 space-y-2 ${className}`} {...props}>
      {children}
    </div>
  );
}
