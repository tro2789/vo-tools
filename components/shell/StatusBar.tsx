import type { ReactNode } from 'react';

export interface StatusBarProps {
  left?: ReactNode[];
  right?: ReactNode[];
  className?: string;
}

export function StatusBar({ left = [], right = [], className = '' }: StatusBarProps) {
  return (
    <div
      className={`flex h-7 items-center justify-between gap-4 bg-bar px-4 text-[11px] text-bar-text ${className}`}
    >
      <div className="flex gap-5">
        {left.map((item, index) => (
          <span
            key={index}
            className={`${index === 0 ? 'text-white' : ''} ${index > 1 ? 'hidden md:inline' : ''}`}
          >
            {item}
          </span>
        ))}
      </div>
      <div className="flex gap-5">
        {right.map((item, index) => (
          <span
            key={index}
            className={index < right.length - 1 ? 'hidden md:inline' : ''}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
