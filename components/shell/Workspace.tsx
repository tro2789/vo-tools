import type { ReactNode } from 'react';

export interface WorkspaceProps {
  main: ReactNode;
  rail: ReactNode;
  /** Extra classes on the main cell, typically a min-height. */
  mainClassName?: string;
  railClassName?: string;
  className?: string;
}

export function Workspace({
  main,
  rail,
  mainClassName = '',
  railClassName = '',
  className = '',
}: WorkspaceProps) {
  return (
    <div
      className={`grid flex-1 grid-cols-1 gap-px bg-line lg:grid-cols-[1fr_340px] ${className}`}
    >
      <div className={`flex min-w-0 flex-col bg-panel ${mainClassName}`}>{main}</div>
      <div className={`flex min-w-0 flex-col bg-panel ${railClassName}`}>{rail}</div>
    </div>
  );
}
