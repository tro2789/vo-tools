import type { ReactNode } from 'react';
import { SectionLabel } from './SectionLabel';

export interface RailSectionProps {
  children: ReactNode;
  /** Section label, rendered as a `SectionLabel`. */
  label?: ReactNode;
  /** Right-hand slot on the label row. */
  labelRight?: ReactNode;
  /** Drop the bottom divider. */
  last?: boolean;
  /** 14px 16px (default) or an even 16px box. */
  pad?: 14 | 16;
  className?: string;
}

export function RailSection({
  children,
  label,
  labelRight,
  last = false,
  pad = 14,
  className = '',
}: RailSectionProps) {
  return (
    <div
      className={`${pad === 16 ? 'p-4' : 'px-4 py-[14px]'} ${
        last ? '' : 'border-b border-line'
      } ${className}`}
    >
      {(label || labelRight) && (
        <div className="mb-[10px] flex items-center justify-between gap-2">
          {label ? <SectionLabel>{label}</SectionLabel> : <span />}
          {labelRight}
        </div>
      )}
      {children}
    </div>
  );
}
