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
    <div className="grid grid-cols-1 gap-4">
      {/* Original Stats */}
      <div className="bg-white dark:bg-[#072030] rounded-xl shadow-xs border border-gray-200 dark:border-gray-700/50 p-5">
        <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
          Original Script
        </div>
        <div className="flex items-baseline gap-3">
          <div className="text-3xl font-black text-gray-900 dark:text-white tabular-nums">
            {originalWordCount}
          </div>
          <div className="text-xs text-gray-500">words</div>
        </div>
        <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 mt-1 tabular-nums">
          {originalTimeEstimate}
        </div>
        {originalPauseAnalysis.pauseCount > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700/50">
            <div className="text-xs text-purple-600 dark:text-purple-400 flex items-center gap-1">
              <Pause size={10} />
              +{originalPauseAnalysis.totalPauseTime.toFixed(1)}s pauses
            </div>
            <div className="text-sm font-semibold text-cyan-500 dark:text-cyan-500 mt-1 tabular-nums">
              {originalTimeWithPauses} total
            </div>
          </div>
        )}
      </div>

      {/* Difference Stats */}
      <div className="bg-linear-to-br from-cyan-50 to-gray-50 dark:from-gray-800 dark:to-gray-800 rounded-xl shadow-xs border border-cyan-200 dark:border-gray-700 p-5">
        <div className="text-xs font-bold text-cyan-500 dark:text-cyan-500 uppercase tracking-wider mb-3">
          Difference
        </div>
        <div className="flex items-baseline gap-3">
          <div className={`text-3xl font-black tabular-nums ${
            wordCountDiff > 0
              ? 'text-green-600 dark:text-green-400'
              : wordCountDiff < 0
              ? 'text-red-600 dark:text-red-400'
              : 'text-gray-500'
          }`}>
            {wordCountDiff > 0 ? '+' : ''}
            {wordCountDiff}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">words</div>
        </div>
        <div className={`text-sm font-semibold mt-2 tabular-nums ${
          wordCountDiff > 0
            ? 'text-green-600 dark:text-green-400'
            : wordCountDiff < 0
            ? 'text-red-600 dark:text-red-400'
            : 'text-gray-500'
        }`}>
          {((wordCountDiff) / (wpm || 1) * 60).toFixed(0)}s reading
        </div>
        {(originalPauseAnalysis.pauseCount > 0 || revisedPauseAnalysis.pauseCount > 0) && (
          <div className="mt-2 pt-2 border-t border-cyan-200 dark:border-gray-700">
            <div className={`text-xs font-semibold flex items-center gap-1 ${
              pauseTimeDiff > 0
                ? 'text-green-600 dark:text-green-400'
                : pauseTimeDiff < 0
                ? 'text-red-600 dark:text-red-400'
                : 'text-gray-500'
            }`}>
              <Pause size={10} />
              {pauseTimeDiff > 0 ? '+' : ''}
              {pauseTimeDiff.toFixed(1)}s pauses
            </div>
          </div>
        )}
      </div>

      {/* Revised Stats */}
      <div className="bg-white dark:bg-[#072030] rounded-xl shadow-xs border border-gray-200 dark:border-gray-700/50 p-5">
        <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
          Revised Script
        </div>
        <div className="flex items-baseline gap-3">
          <div className="text-3xl font-black text-gray-900 dark:text-white tabular-nums">
            {revisedWordCount}
          </div>
          <div className="text-xs text-gray-500">words</div>
        </div>
        <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 mt-1 tabular-nums">
          {revisedTimeEstimate}
        </div>
        {revisedPauseAnalysis.pauseCount > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700/50">
            <div className="text-xs text-purple-600 dark:text-purple-400 flex items-center gap-1">
              <Pause size={10} />
              +{revisedPauseAnalysis.totalPauseTime.toFixed(1)}s pauses
            </div>
            <div className="text-sm font-semibold text-cyan-500 dark:text-cyan-500 mt-1 tabular-nums">
              {revisedTimeWithPauses} total
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
