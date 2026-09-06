import { RailSection } from '@/components/shell';

export interface Lookup {
  word: string;
  pronunciation: string;
}

interface LookedUpListProps {
  lookups: Lookup[];
}

/** The words looked up this session, most recent first. */
export const LookedUpList = ({ lookups }: LookedUpListProps) => {
  return (
    <RailSection label="LOOKED UP">
      {lookups.length === 0 ? (
        <p className="text-[12px] leading-[1.55] text-muted">
          Click a word in the script to look it up.
        </p>
      ) : (
        <div className="flex flex-col">
          {lookups.map((lookup, index) => (
            <div
              key={lookup.word}
              className={`flex h-7 items-center justify-between gap-3 ${
                index < lookups.length - 1 ? 'border-b border-line-faint' : ''
              }`}
            >
              <span className="shrink-0 text-[12px] text-ink">{lookup.word}</span>
              <span className="truncate text-[11px] tracking-[0.04em] text-muted">
                {lookup.pronunciation}
              </span>
            </div>
          ))}
        </div>
      )}
    </RailSection>
  );
};
