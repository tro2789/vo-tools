import React from 'react';
import { Type } from 'lucide-react';
import { DiffSegment } from '@/utils/textComparison';

interface DiffVisualizationProps {
  originalSegments: DiffSegment[];
  revisedSegments: DiffSegment[];
}

export const DiffVisualization: React.FC<DiffVisualizationProps> = ({
  originalSegments,
  revisedSegments
}) => {
  const renderDiffText = (segments: DiffSegment[]) => {
    return segments.map((segment, index) => {
      const isWhitespace = /^\s+$/.test(segment.value);
      
      if (segment.type === 'unchanged') {
        return (
          <span key={index} className="text-slate-700 dark:text-slate-300">
            {segment.value}
          </span>
        );
      } else if (segment.type === 'added') {
        return (
          <span
            key={index}
            className={`bg-green-200 dark:bg-green-900/40 text-green-900 dark:text-green-200 ${
              isWhitespace ? '' : 'rounded px-0.5'
            }`}
          >
            {segment.value}
          </span>
        );
      } else if (segment.type === 'removed') {
        return (
          <span
            key={index}
            className={`bg-red-200 dark:bg-red-900/40 text-red-900 dark:text-red-200 line-through ${
              isWhitespace ? '' : 'rounded px-0.5'
            }`}
          >
            {segment.value}
          </span>
        );
      }
    });
  };

  if (originalSegments.length === 0 && revisedSegments.length === 0) {
    return null;
  }

  return (
    <>
      <div className="text-center">
        <h3 className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
          Difference Visualization
        </h3>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Original with Highlights */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800/60 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <Type size={14} />
              <span className="text-xs font-bold uppercase tracking-wider">Original (with deletions)</span>
            </div>
          </div>
          <div className="p-6 max-h-[40vh] overflow-y-auto text-lg leading-relaxed">
            {renderDiffText(originalSegments)}
          </div>
        </div>

        {/* Revised with Highlights */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800/60 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <Type size={14} />
              <span className="text-xs font-bold uppercase tracking-wider">Revised (with additions)</span>
            </div>
          </div>
          <div className="p-6 max-h-[40vh] overflow-y-auto text-lg leading-relaxed">
            {renderDiffText(revisedSegments)}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800/60 p-5">
        <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
          Legend
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="bg-green-200 dark:bg-green-900/40 text-green-900 dark:text-green-200 px-2 py-1 rounded text-sm">
              Added
            </span>
            <span className="text-xs text-slate-500">New text in revised</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-red-200 dark:bg-red-900/40 text-red-900 dark:text-red-200 line-through px-2 py-1 rounded text-sm">
              Removed
            </span>
            <span className="text-xs text-slate-500">Deleted from original</span>
          </div>
        </div>
      </div>
    </>
  );
};
