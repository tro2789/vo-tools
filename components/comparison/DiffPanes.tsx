import { DiffSegment } from '@/utils/textComparison';

interface DiffPanesProps {
  originalSegments: DiffSegment[];
  revisedSegments: DiffSegment[];
}

function renderSegments(segments: DiffSegment[]) {
  return segments.map((segment, index) => {
    if (segment.type === 'added') {
      return (
        <span key={index} className="bg-ok-bg text-ok">
          {segment.value}
        </span>
      );
    }
    if (segment.type === 'removed') {
      return (
        <span key={index} className="bg-bad-bg text-bad line-through">
          {segment.value}
        </span>
      );
    }
    return <span key={index}>{segment.value}</span>;
  });
}

/** The two side-by-side diff readouts under the compare editors. */
export const DiffPanes = ({ originalSegments, revisedSegments }: DiffPanesProps) => {
  const pane =
    'min-h-[160px] overflow-auto bg-panel px-[18px] py-4 text-[14px] leading-[1.8] whitespace-pre-wrap text-body';

  return (
    <div className="grid flex-1 grid-cols-1 gap-px bg-line lg:grid-cols-2">
      <div className={pane}>{renderSegments(originalSegments)}</div>
      <div className={pane}>{renderSegments(revisedSegments)}</div>
    </div>
  );
};
