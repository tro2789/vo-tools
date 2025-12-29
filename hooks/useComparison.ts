import { useState, useEffect, useMemo } from 'react';
import { compareTexts, DiffSegment } from '@/utils/textComparison';

/**
 * Custom hook for script comparison functionality
 * Handles diff calculation and comparison state
 */
export const useComparison = (originalText: string, revisedText: string) => {
  const [diffSegments, setDiffSegments] = useState<{
    originalSegments: DiffSegment[];
    revisedSegments: DiffSegment[];
  }>({
    originalSegments: [],
    revisedSegments: []
  });

  // Memoize diff calculation - this is expensive
  const diff = useMemo(() => {
    if (!originalText && !revisedText) {
      return { originalSegments: [], revisedSegments: [] };
    }
    return compareTexts(originalText, revisedText);
  }, [originalText, revisedText]);

  // Update diff segments when diff changes
  useEffect(() => {
    setDiffSegments(diff);
  }, [diff]);

  return {
    diffSegments
  };
};
