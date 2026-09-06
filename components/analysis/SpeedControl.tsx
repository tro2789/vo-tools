'use client';

import { RailSection } from '@/components/shell';

interface SpeedControlProps {
  wpm: number;
  setWpm: (wpm: number) => void;
  minWpm?: number;
  maxWpm?: number;
  /** Helper sentence shown on first run. */
  helper?: string;
}

export const SpeedControl = ({
  wpm,
  setWpm,
  minWpm = 75,
  maxWpm = 160,
  helper,
}: SpeedControlProps) => {
  return (
    <RailSection
      label="READING SPEED"
      labelRight={<span className="text-[12px] font-semibold text-ink">{wpm} WPM</span>}
    >
      <input
        type="range"
        min={minWpm}
        max={maxWpm}
        value={wpm}
        aria-label="Reading speed in words per minute"
        onChange={(event) => setWpm(parseInt(event.target.value, 10))}
        className="h-1 w-full cursor-pointer"
      />
      {helper ? <p className="mt-2 text-[11px] leading-[1.5] text-muted">{helper}</p> : null}
    </RailSection>
  );
};
