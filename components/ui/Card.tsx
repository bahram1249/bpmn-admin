import * as React from 'react';

export function Card({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <div className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>{children}</div>;
}

export function CardHeader({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <div className={`border-b border-slate-200 px-4 py-3 ${className}`}>{children}</div>;
}

export function CardTitle({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <h2 className={`text-lg font-semibold text-slate-800 ${className}`}>{children}</h2>;
}

export function CardContent({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}
