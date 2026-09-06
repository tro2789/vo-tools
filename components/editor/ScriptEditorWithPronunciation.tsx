'use client';

import { useState, type ReactNode } from 'react';
import { ScriptEditor } from './ScriptEditor';
import { ScriptTextDisplay } from '../pronunciation/ScriptTextDisplay';

export type EditorViewMode = 'edit' | 'pronunciation';

interface ScriptEditorWithPronunciationProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  height?: string;
  showPronunciationToggle?: boolean;
  /** Show the "N CHARS" meta while editing. Defaults to true. */
  charsMeta?: boolean;
  /** Rendered under the editor body, inside the cell (first-run actions). */
  bottomSlot?: ReactNode;
  /** Controlled tab. Falls back to internal state when omitted. */
  viewMode?: EditorViewMode;
  onViewModeChange?: (mode: EditorViewMode) => void;
  onLookup?: (word: string, pronunciation: string) => void;
  className?: string;
}

const HINT =
  'WORDS FOUND IN THE DICTIONARY UNDERLINE ON HOVER · ESC CLOSES · COPY BUTTON PUTS THE NOTATION ON YOUR CLIPBOARD';

/**
 * The workspace main cell: an Edit / Pronunciation tab strip over either the
 * borderless textarea or the clickable pronunciation view.
 */
export const ScriptEditorWithPronunciation = ({
  value,
  onChange,
  placeholder = 'Paste your script here...',
  label = 'Script',
  height = 'flex-1 min-h-[200px]',
  showPronunciationToggle = true,
  charsMeta = true,
  bottomSlot,
  viewMode,
  onViewModeChange,
  onLookup,
  className = '',
}: ScriptEditorWithPronunciationProps) => {
  const [internalMode, setInternalMode] = useState<EditorViewMode>('edit');
  const mode = viewMode ?? internalMode;
  const hasText = value.trim().length > 0;
  const pronunciationEnabled = showPronunciationToggle && hasText;
  const activeMode: EditorViewMode = pronunciationEnabled ? mode : 'edit';

  const setMode = (next: EditorViewMode) => {
    setInternalMode(next);
    onViewModeChange?.(next);
  };

  if (!showPronunciationToggle) {
    return (
      <ScriptEditor
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        label={label}
        height={height}
        charsMeta={charsMeta}
        bottomSlot={bottomSlot}
        className={className}
      />
    );
  }

  const tabs = (
    <div className="flex gap-[2px]">
      <button
        type="button"
        onClick={() => setMode('edit')}
        aria-pressed={activeMode === 'edit'}
        className={`h-8 px-[10px] text-[11px] ${
          activeMode === 'edit'
            ? 'font-medium text-ink shadow-[inset_0_-2px_0_var(--button)]'
            : 'text-muted'
        }`}
      >
        Edit
      </button>
      <button
        type="button"
        onClick={() => setMode('pronunciation')}
        disabled={!pronunciationEnabled}
        aria-pressed={activeMode === 'pronunciation'}
        className={`h-8 px-[10px] text-[11px] disabled:cursor-not-allowed disabled:text-disabled ${
          activeMode === 'pronunciation'
            ? 'font-medium text-ink shadow-[inset_0_-2px_0_var(--button)]'
            : 'text-muted'
        }`}
      >
        Pronunciation
      </button>
    </div>
  );

  if (activeMode === 'edit') {
    return (
      <ScriptEditor
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        label={label}
        height={height}
        charsMeta={charsMeta}
        headerLeft={tabs}
        bottomSlot={bottomSlot}
        className={className}
        textareaLabel={label}
      />
    );
  }

  return (
    <div className={`flex min-w-0 flex-col bg-panel ${height} ${className}`}>
      <div className="flex h-8 shrink-0 items-center justify-between gap-3 border-b border-line px-[14px]">
        {tabs}
        <span className="text-[11px] text-muted uppercase">CLICK A WORD</span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-7 py-6">
        <ScriptTextDisplay text={value} onLookup={onLookup} />
      </div>

      <div className="flex min-h-[30px] shrink-0 items-center border-t border-line bg-subtle px-[14px] py-1 text-[11px] text-muted">
        {HINT}
      </div>
    </div>
  );
};
