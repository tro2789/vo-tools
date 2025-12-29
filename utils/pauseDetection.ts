/**
 * Represents different types of pauses detected in text
 */
export interface PauseInfo {
  type: 'line_break' | 'paragraph' | 'bullet' | 'ellipsis' | 'em_dash' | 'stage_direction' | 'comma' | 'period' | 'colon' | 'semicolon';
  position: number;
  text: string;
  duration: number; // in seconds
}

export interface PauseAnalysis {
  pauses: PauseInfo[];
  totalPauseTime: number; // in seconds
  pauseCount: number;
}

// Default pause durations (in seconds)
const PAUSE_DURATIONS = {
  line_break: 0.5,
  paragraph: 1.0,
  bullet: 0.5,
  ellipsis: 1.0,
  em_dash: 0.5,
  stage_direction: 1.5,
  comma: 0.3,
  period: 0.5,
  colon: 0.4,
  semicolon: 0.4,
};

/**
 * Detects pauses in text and estimates their duration
 */
export const detectPauses = (text: string): PauseAnalysis => {
  const pauses: PauseInfo[] = [];
  let position = 0;

  if (!text) {
    return { pauses: [], totalPauseTime: 0, pauseCount: 0 };
  }

  // 1. Detect stage directions: (beat), [pause], (pause), etc.
  const stageDirectionRegex = /[\(\[](?:beat|pause|silence|wait|breath|sigh)[\)\]]/gi;
  let match;
  while ((match = stageDirectionRegex.exec(text)) !== null) {
    pauses.push({
      type: 'stage_direction',
      position: match.index,
      text: match[0],
      duration: PAUSE_DURATIONS.stage_direction,
    });
  }

  // 2. Detect paragraph breaks (two or more newlines)
  const paragraphRegex = /\n\s*\n+/g;
  while ((match = paragraphRegex.exec(text)) !== null) {
    pauses.push({
      type: 'paragraph',
      position: match.index,
      text: match[0],
      duration: PAUSE_DURATIONS.paragraph,
    });
  }

  // 3. Detect single line breaks
  const lineBreakRegex = /(?<!\n)\n(?!\n)/g;
  while ((match = lineBreakRegex.exec(text)) !== null) {
    pauses.push({
      type: 'line_break',
      position: match.index,
      text: match[0],
      duration: PAUSE_DURATIONS.line_break,
    });
  }

  // 4. Detect bullet points (-, •, *, numbers with dots)
  const bulletRegex = /(?:^|\n)\s*(?:[-•*]|\d+\.)\s+/gm;
  while ((match = bulletRegex.exec(text)) !== null) {
    pauses.push({
      type: 'bullet',
      position: match.index,
      text: match[0],
      duration: PAUSE_DURATIONS.bullet,
    });
  }

  // 5. Detect ellipses
  const ellipsisRegex = /\.{3,}|…/g;
  while ((match = ellipsisRegex.exec(text)) !== null) {
    pauses.push({
      type: 'ellipsis',
      position: match.index,
      text: match[0],
      duration: PAUSE_DURATIONS.ellipsis,
    });
  }

  // 6. Detect em-dashes
  const emDashRegex = /—|--/g;
  while ((match = emDashRegex.exec(text)) !== null) {
    pauses.push({
      type: 'em_dash',
      position: match.index,
      text: match[0],
      duration: PAUSE_DURATIONS.em_dash,
    });
  }

  // 7. Detect punctuation (comma, period, colon, semicolon)
  // For commas, skip those that are part of numbers (e.g., 10,000)
  const commaRegex = /,/g;
  while ((match = commaRegex.exec(text)) !== null) {
    const before = text[match.index - 1];
    const after = text[match.index + 1];
    
    // Skip if comma is between digits (part of a number like 10,000)
    if (/\d/.test(before) && /\d/.test(after)) {
      continue;
    }
    
    pauses.push({
      type: 'comma',
      position: match.index,
      text: ',',
      duration: PAUSE_DURATIONS.comma,
    });
  }

  const periodRegex = /\./g;
  while ((match = periodRegex.exec(text)) !== null) {
    // Skip if it's part of an ellipsis or number
    const before = text[match.index - 1];
    const after = text[match.index + 1];
    if (before !== '.' && after !== '.' && !/\d/.test(before)) {
      pauses.push({
        type: 'period',
        position: match.index,
        text: '.',
        duration: PAUSE_DURATIONS.period,
      });
    }
  }

  const colonRegex = /:/g;
  while ((match = colonRegex.exec(text)) !== null) {
    pauses.push({
      type: 'colon',
      position: match.index,
      text: ':',
      duration: PAUSE_DURATIONS.colon,
    });
  }

  const semicolonRegex = /;/g;
  while ((match = semicolonRegex.exec(text)) !== null) {
    pauses.push({
      type: 'semicolon',
      position: match.index,
      text: ';',
      duration: PAUSE_DURATIONS.semicolon,
    });
  }

  // Sort pauses by position
  pauses.sort((a, b) => a.position - b.position);

  // Calculate total pause time
  const totalPauseTime = pauses.reduce((sum, pause) => sum + pause.duration, 0);

  return {
    pauses,
    totalPauseTime,
    pauseCount: pauses.length,
  };
};

/**
 * Get a summary of pause types for display
 */
export const getPauseSummary = (analysis: PauseAnalysis): {
  [key: string]: { count: number; totalTime: number };
} => {
  const summary: { [key: string]: { count: number; totalTime: number } } = {};

  analysis.pauses.forEach((pause) => {
    if (!summary[pause.type]) {
      summary[pause.type] = { count: 0, totalTime: 0 };
    }
    summary[pause.type].count++;
    summary[pause.type].totalTime += pause.duration;
  });

  return summary;
};

/**
 * Get human-readable pause type names
 */
export const getPauseTypeName = (type: PauseInfo['type']): string => {
  const names: { [key in PauseInfo['type']]: string } = {
    line_break: 'Line Breaks',
    paragraph: 'Paragraph Breaks',
    bullet: 'Bullet Points',
    ellipsis: 'Ellipses',
    em_dash: 'Em-Dashes',
    stage_direction: 'Stage Directions',
    comma: 'Commas',
    period: 'Periods',
    colon: 'Colons',
    semicolon: 'Semicolons',
  };
  return names[type];
};
