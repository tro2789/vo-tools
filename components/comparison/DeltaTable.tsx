import { RailSection } from '@/components/shell';
import {
  deltaTone,
  formatClock,
  formatClockDelta,
  formatCountDelta,
  formatSecondsDelta,
} from '../analysis/format';

interface DeltaTableProps {
  originalWordCount: number;
  revisedWordCount: number;
  originalPauseTime: number;
  revisedPauseTime: number;
  wpm: number;
}

const GRID = 'grid grid-cols-[1fr_62px_62px_58px] items-center gap-[6px]';

function Row({
  label,
  original,
  revised,
  delta,
  tone,
  total = false,
}: {
  label: string;
  original: string;
  revised: string;
  delta: string;
  tone: string;
  total?: boolean;
}) {
  return (
    <div className={`${GRID} ${total ? 'h-9' : 'h-8 border-b border-line-faint'}`}>
      <span className={total ? 'text-[13px] font-semibold text-ink' : 'text-[12px] text-body'}>
        {label}
      </span>
      <span className="text-right text-[12px] text-body">{original}</span>
      <span
        className={`text-right font-semibold text-ink ${total ? 'text-[18px]' : 'text-[13px]'}`}
      >
        {revised}
      </span>
      <span className={`text-right text-[12px] font-semibold ${tone}`}>{delta}</span>
    </div>
  );
}

export const DeltaTable = ({
  originalWordCount,
  revisedWordCount,
  originalPauseTime,
  revisedPauseTime,
  wpm,
}: DeltaTableProps) => {
  const rate = wpm || 1;
  const originalWordsOnly = (originalWordCount / rate) * 60;
  const revisedWordsOnly = (revisedWordCount / rate) * 60;
  const originalTotal = originalWordsOnly + originalPauseTime;
  const revisedTotal = revisedWordsOnly + revisedPauseTime;

  const wordDelta = revisedWordCount - originalWordCount;
  const wordsOnlyDelta = revisedWordsOnly - originalWordsOnly;
  const pauseDelta = revisedPauseTime - originalPauseTime;
  const totalDelta = revisedTotal - originalTotal;

  return (
    <RailSection label="DELTA">
      <div
        className={`${GRID} h-6 border-b border-line text-[10px] font-semibold tracking-[0.1em] text-muted uppercase`}
      >
        <span />
        <span className="text-right">ORIG</span>
        <span className="text-right">REV</span>
        <span className="text-right">Δ</span>
      </div>
      <Row
        label="Spoken words"
        original={String(originalWordCount)}
        revised={String(revisedWordCount)}
        delta={formatCountDelta(wordDelta)}
        tone={deltaTone(wordDelta)}
      />
      <Row
        label="Words only"
        original={formatClock(originalWordsOnly)}
        revised={formatClock(revisedWordsOnly)}
        delta={formatClockDelta(wordsOnlyDelta)}
        tone={deltaTone(wordsOnlyDelta)}
      />
      <Row
        label="Pauses"
        original={`+${originalPauseTime.toFixed(1)}s`}
        revised={`+${revisedPauseTime.toFixed(1)}s`}
        delta={formatSecondsDelta(pauseDelta)}
        tone={deltaTone(pauseDelta)}
      />
      <Row
        total
        label="Total time"
        original={formatClock(originalTotal)}
        revised={formatClock(revisedTotal)}
        delta={formatClockDelta(totalDelta)}
        tone={deltaTone(totalDelta)}
      />
    </RailSection>
  );
};
