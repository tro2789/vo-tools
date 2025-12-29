/**
 * Represents a segment of text with its change type
 */
export interface DiffSegment {
  value: string;
  type: 'added' | 'removed' | 'unchanged';
}

/**
 * Simple word-based diff algorithm using longest common subsequence
 */
export const compareTexts = (original: string, revised: string): {
  originalSegments: DiffSegment[];
  revisedSegments: DiffSegment[];
} => {
  // Split texts into words while preserving whitespace
  const originalWords = splitIntoTokens(original);
  const revisedWords = splitIntoTokens(revised);

  // Compute the diff using LCS-based algorithm
  const diff = computeDiff(originalWords, revisedWords);

  return {
    originalSegments: diff.originalSegments,
    revisedSegments: diff.revisedSegments,
  };
};

/**
 * Split text into tokens (words + whitespace) for better diff visualization
 */
const splitIntoTokens = (text: string): string[] => {
  if (!text) return [];
  
  // Match words and whitespace separately
  const tokens: string[] = [];
  const regex = /(\S+|\s+)/g;
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    tokens.push(match[0]);
  }
  
  return tokens;
};

/**
 * Compute diff using dynamic programming (LCS approach)
 */
const computeDiff = (
  original: string[],
  revised: string[]
): {
  originalSegments: DiffSegment[];
  revisedSegments: DiffSegment[];
} => {
  const m = original.length;
  const n = revised.length;

  // Create LCS matrix
  const lcs: number[][] = Array(m + 1)
    .fill(0)
    .map(() => Array(n + 1).fill(0));

  // Fill LCS matrix
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (original[i - 1] === revised[j - 1]) {
        lcs[i][j] = lcs[i - 1][j - 1] + 1;
      } else {
        lcs[i][j] = Math.max(lcs[i - 1][j], lcs[i][j - 1]);
      }
    }
  }

  // Backtrack to build diff segments
  const originalSegments: DiffSegment[] = [];
  const revisedSegments: DiffSegment[] = [];

  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && original[i - 1] === revised[j - 1]) {
      // Unchanged
      originalSegments.unshift({
        value: original[i - 1],
        type: 'unchanged',
      });
      revisedSegments.unshift({
        value: revised[j - 1],
        type: 'unchanged',
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || lcs[i][j - 1] >= lcs[i - 1][j])) {
      // Added in revised
      revisedSegments.unshift({
        value: revised[j - 1],
        type: 'added',
      });
      j--;
    } else if (i > 0) {
      // Removed from original
      originalSegments.unshift({
        value: original[i - 1],
        type: 'removed',
      });
      i--;
    }
  }

  // Merge consecutive segments of the same type for cleaner display
  return {
    originalSegments: mergeSegments(originalSegments),
    revisedSegments: mergeSegments(revisedSegments),
  };
};

/**
 * Merge consecutive segments of the same type
 */
const mergeSegments = (segments: DiffSegment[]): DiffSegment[] => {
  if (segments.length === 0) return [];

  const merged: DiffSegment[] = [];
  let current = { ...segments[0] };

  for (let i = 1; i < segments.length; i++) {
    if (segments[i].type === current.type) {
      current.value += segments[i].value;
    } else {
      merged.push(current);
      current = { ...segments[i] };
    }
  }
  merged.push(current);

  return merged;
};
