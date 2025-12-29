import React from 'react';
import { Pause } from 'lucide-react';
import { PauseAnalysis } from '@/utils/pauseDetection';

interface ComparisonStatsProps {
  originalWordCount: number;
  revisedWordCount: number;
  originalTimeEstimate: string;
  revisedTimeEstimate: string;
  originalPauseAnalysis: PauseAnalysis;
  revisedPauseAnalysis: PauseAnalysis;
  originalTimeWithPauses: string;
  revisedTimeWithPauses: string;
  wpm: number;
}

export const ComparisonStats: React.FC<ComparisonStatsProps> = ({
  originalWordCount,
  revisedWordCount,
  originalTimeEstimate,
  revisedTimeEstimate,
  originalPauseAnalysis,
  revisedPauseAnalysis,
  originalTimeWithPauses,
  revisedTimeWithPauses,
  wpm
}) => {
  const wordCountDiff = revisedWordCount - originalWordCount;
  const pauseTimeDiff = revisedPauseAnalysis.totalPauseTime - originalPauseAnalysis.totalPauseTime;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Original Stats */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800/60 p-5">
        <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
          Original Script
        </div>
        <div className="flex items-baseline gap-3">
          <div className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">
            {originalWordCount}
          </div>
          <div className="text-xs text-slate-500">words</div>
        </div>
        <div className="text-sm font-semibold text-slate-600 dark:text-slate-400 mt-1 tabular-nums">
          {originalTimeEstimate}
        </div>
        {originalPauseAnalysis.pauseCount > 0 && (
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="text-xs text-purple-600 dark:text-purple-400 flex items-center gap-1">
              <Pause size={10} />
              +{originalPauseAnalysis.totalPauseTime.toFixed(1)}s pauses
            </div>
            <div className="text-sm font-semibold text-blue-600 dark:text-blue-400 mt-1 tabular-nums">
              {originalTimeWithPauses} total
            </div>
          </div>
        )}
      </div>

      {/* Difference Stats */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800 rounded-xl shadow-sm border border-blue-200 dark:border-slate-700 p-5">
        <div className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3">
          Difference
        </div>
        <div className="flex items-baseline gap-3">
          <div className={`text-3xl font-black tabular-nums ${
            wordCountDiff > 0
              ? 'text-green-600 dark:text-green-400'
              : wordCountDiff < 0
              ? 'text-red-600 dark:text-red-400'
              : 'text-slate-500'
          }`}>
            {wordCountDiff > 0 ? '+' : ''}
            {wordCountDiff}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400">words</div>
        </div>
        <div className={`text-sm font-semibold mt-2 tabular-nums ${
          wordCountDiff > 0
            ? 'text-green-600 dark:text-green-400'
            : wordCountDiff < 0
            ? 'text-red-600 dark:text-red-400'
            : 'text-slate-500'
        }`}>
          {((wordCountDiff) / (wpm || 1) * 60).toFixed(0)}s reading
        </div>
        {(originalPauseAnalysis.pauseCount > 0 || revisedPauseAnalysis.pauseCount > 0) && (
          <div className="mt-2 pt-2 border-t border-blue-200 dark:border-slate-700">
            <div className={`text-xs font-semibold flex items-center gap-1 ${
              pauseTimeDiff > 0
                ? 'text-green-600 dark:text-green-400'
                : pauseTimeDiff < 0
                ? 'text-red-600 dark:text-red-400'
                : 'text-slate-500'
            }`}>
              <Pause size={10} />
              {pauseTimeDiff > 0 ? '+' : ''}
              {pauseTimeDiff.toFixed(1)}s pauses
            </div>
          </div>
        )}
      </div>

      {/* Revised Stats */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800/60 p-5">
        <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
          Revised Script
        </div>
        <div className="flex items-baseline gap-3">
          <div className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">
            {revisedWordCount}
          </div>
          <div className="text-xs text-slate-500">words</div>
        </div>
        <div className="text-sm font-semibold text-slate-600 dark:text-slate-400 mt-1 tabular-nums">
          {revisedTimeEstimate}
        </div>
        {revisedPauseAnalysis.pauseCount > 0 && (
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="text-xs text-purple-600 dark:text-purple-400 flex items-center gap-1">
              <Pause size={10} />
              +{revisedPauseAnalysis.totalPauseTime.toFixed(1)}s pauses
            </div>
            <div className="text-sm font-semibold text-blue-600 dark:text-blue-400 mt-1 tabular-nums">
              {revisedTimeWithPauses} total
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
