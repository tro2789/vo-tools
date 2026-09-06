import { RailSection, SectionLabel } from '@/components/shell';

export interface MetricsBlockProps {
  wordCount: number;
  /** Total read time including pauses, `m:ss`. */
  totalTime: string;
  /** Read time without pauses, `m:ss`. */
  wordsOnlyTime: string;
  pauseTime: number;
  pauseCount: number;
  /** First run — grey the numbers and drop the sub-line. */
  empty?: boolean;
}

export const MetricsBlock = ({
  wordCount,
  totalTime,
  wordsOnlyTime,
  pauseTime,
  pauseCount,
  empty = false,
}: MetricsBlockProps) => {
  const value = `text-[40px] leading-none font-semibold ${empty ? 'text-disabled' : 'text-ink'}`;

  return (
    <RailSection pad={16}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <SectionLabel>SPOKEN WORDS</SectionLabel>
          <div className={`mt-[6px] ${value}`}>{wordCount}</div>
        </div>
        <div className="text-right">
          <SectionLabel>TOTAL</SectionLabel>
          <div className={`mt-[6px] ${value}`}>{totalTime}</div>
        </div>
      </div>
      {!empty && (
        <div className="mt-[10px] flex flex-wrap gap-4 text-[11px] text-muted uppercase">
          <span>WORDS ONLY {wordsOnlyTime}</span>
          <span>
            PAUSES +{pauseTime.toFixed(1)}s / {pauseCount}
          </span>
        </div>
      )}
    </RailSection>
  );
};
