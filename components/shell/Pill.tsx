import type { ReactNode } from 'react';

export interface PillProps {
  tone: 'ok' | 'bad';
  children: ReactNode;
  className?: string;
}

export function Pill({ tone, children, className = '' }: PillProps) {
  return (
    <span
      className={`inline-flex items-center border px-[6px] py-[2px] text-[11px] font-semibold ${
        tone === 'ok' ? 'border-ok text-ok' : 'border-bad text-bad'
      } ${className}`}
    >
      {children}
    </span>
  );
}
