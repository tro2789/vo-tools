export type SavedState = 'saved' | 'saving' | 'empty';

export interface SavedIndicatorProps {
  state: SavedState;
  className?: string;
}

const LABELS: Record<SavedState, string> = {
  saved: 'SAVED',
  saving: 'SAVING…',
  empty: 'NOTHING TO SAVE YET',
};

export function SavedIndicator({ state, className = '' }: SavedIndicatorProps) {
  return (
    <span
      className={`flex items-center gap-[6px] text-[11px] text-muted ${className}`}
    >
      <span
        className="h-[5px] w-[5px] rounded-full"
        style={{ background: state === 'empty' ? 'var(--disabled)' : 'var(--ok)' }}
      />
      {LABELS[state]}
    </span>
  );
}
