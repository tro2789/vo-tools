import type { ReactNode } from 'react';

export interface SectionLabelProps {
  children: ReactNode;
  className?: string;
}

export function SectionLabel({ children, className = '' }: SectionLabelProps) {
  return (
    <span
      className={`text-[10px] font-semibold uppercase tracking-[0.14em] text-muted ${className}`}
    >
      {children}
    </span>
  );
}
