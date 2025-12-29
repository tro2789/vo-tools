import { useState, useEffect, useMemo } from 'react';
import { calculateSpokenWordCount, formatDuration, analyzePauses, calculateTotalTimeWithPauses } from '@/utils/textAnalysis';
import { PauseAnalysis } from '@/utils/pauseDetection';
import { ExpansionOptions } from '@/utils/expansionOptions';

/**
 * Custom hook for analyzing script text
 * Handles word count, reading time, and pause detection
 */
export const useScriptAnalysis = (
  text: string,
  wpm: number,
  expansionOptions: ExpansionOptions
) => {
  const [pauseAnalysis, setPauseAnalysis] = useState<PauseAnalysis>({
    pauses: [],
    totalPauseTime: 0,
    pauseCount: 0
  });

  // Memoize word count calculation to avoid recalculating on every render
  const wordCount = useMemo(() => {
    return calculateSpokenWordCount(text, expansionOptions);
  }, [text, expansionOptions]);

  // Memoize time estimate calculation
  const timeEstimate = useMemo(() => {
    const minutes = wordCount / (wpm || 1);
    return formatDuration(minutes);
  }, [wordCount, wpm]);

  // Analyze pauses when text changes
  useEffect(() => {
    const pauseData = analyzePauses(text);
    setPauseAnalysis(pauseData);
  }, [text]);

  // Memoize total time with pauses calculation
  const timeWithPauses = useMemo(() => {
    const totalMinutes = calculateTotalTimeWithPauses(
      wordCount,
      wpm,
      pauseAnalysis.totalPauseTime
    );
    return formatDuration(totalMinutes);
  }, [wordCount, wpm, pauseAnalysis.totalPauseTime]);

  return {
    wordCount,
    timeEstimate,
    pauseAnalysis,
    timeWithPauses
  };
};
