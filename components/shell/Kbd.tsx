import type { ReactNode } from 'react';

export interface KbdProps {
  children: ReactNode;
  className?: string;
}

export function Kbd({ children, className = '' }: KbdProps) {
  return (
    <kbd
      className={`border border-line-strong px-[6px] py-[2px] font-sans text-[10px] font-normal text-body ${className}`}
    >
      {children}
    </kbd>
  );
}
