'use client';

import type { ReactNode } from 'react';

export interface ScriptEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Header label. Ignored when `headerLeft` is supplied. */
  label?: string;
  /** Height utility class for the shell, e.g. `h-[240px]`. */
  height?: string;
  /** Show the "N CHARS" meta on the right of the header. Defaults to true. */
  charsMeta?: boolean;
  /** Replaces the header label. */
  headerLeft?: ReactNode;
  /** Replaces the header meta. */
  headerRight?: ReactNode;
  /** Rendered under the textarea, inside the cell. */
  bottomSlot?: ReactNode;
  /** 30px header + 14px/1.7 body (compare panes) instead of 32px + 15px/1.8. */
  compact?: boolean;
  labelTone?: 'muted' | 'ink';
  className?: string;
  textareaLabel?: string;
}

/**
 * Borderless workspace editor: a header strip plus a textarea that fills the cell.
 * No panel chrome of its own — it is meant to sit inside a `Workspace` cell.
 */
export const ScriptEditor = ({
  value,
  onChange,
  placeholder = 'Paste your script here...',
  label = 'Script',
  height = 'flex-1 min-h-[200px]',
  charsMeta = true,
  headerLeft,
  headerRight,
  bottomSlot,
  compact = false,
  labelTone = 'muted',
  className = '',
  textareaLabel,
}: ScriptEditorProps) => {
  return (
    <div className={`flex min-w-0 flex-col bg-panel ${height} ${className}`}>
      <div
        className={`flex shrink-0 items-center justify-between gap-3 border-b border-line px-[14px] ${
          compact ? 'h-[30px]' : 'h-8'
        }`}
      >
        {headerLeft ?? (
          <span
            className={`text-[10px] font-semibold tracking-[0.14em] uppercase ${
              labelTone === 'ink' ? 'text-ink' : 'text-muted'
            }`}
          >
            {label}
          </span>
        )}
        {headerRight ??
          (charsMeta ? (
            <span className="text-[11px] text-muted uppercase">{value.length} CHARS</span>
          ) : null)}
      </div>

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={textareaLabel ?? label}
        spellCheck={false}
        className={`w-full flex-1 resize-none border-none bg-transparent text-body outline-none placeholder:text-muted ${
          compact ? 'px-[18px] py-4 text-[14px] leading-[1.7]' : 'px-7 py-6 text-[15px] leading-[1.8]'
        }`}
      />

      {bottomSlot}
    </div>
  );
};
