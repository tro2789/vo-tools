import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface DocumentBarProps {
  icon: LucideIcon;
  /** Document name — an editable input or static text. */
  title: ReactNode;
  /** Saved indicator, "3 FILES · 12.4 MB", etc. */
  meta?: ReactNode;
  /** Right-hand controls. */
  actions?: ReactNode;
  className?: string;
}

export function DocumentBar({ icon: Icon, title, meta, actions, className = '' }: DocumentBarProps) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line bg-panel px-4 py-[10px] ${className}`}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-x-[10px] gap-y-1">
        <Icon width={14} height={14} className="shrink-0 text-muted" aria-hidden="true" />
        {title}
        {meta}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
