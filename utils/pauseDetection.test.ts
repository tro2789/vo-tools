import { describe, it, expect } from 'vitest';
import { detectPauses, getPauseSummary, getPauseTypeName } from './pauseDetection';

describe('detectPauses', () => {
  it('returns empty analysis for empty text', () => {
    expect(detectPauses('')).toEqual({ pauses: [], totalPauseTime: 0, pauseCount: 0 });
  });

  it('detects a stage direction like (beat)', () => {
    const result = detectPauses('Wait for it. (beat) Now go.');
    const stageDirections = result.pauses.filter((p) => p.type === 'stage_direction');
    expect(stageDirections).toHaveLength(1);
    expect(stageDirections[0].text.toLowerCase()).toBe('(beat)');
  });

  it('detects [pause] bracket stage directions case-insensitively', () => {
    const result = detectPauses('Hold on [PAUSE] then continue.');
    expect(result.pauses.some((p) => p.type === 'stage_direction')).toBe(true);
  });

  it('detects paragraph breaks (two+ newlines) distinct from single line breaks', () => {
    const result = detectPauses('Line one.\n\nLine two.\nLine three.');
    const paragraphs = result.pauses.filter((p) => p.type === 'paragraph');
    const lineBreaks = result.pauses.filter((p) => p.type === 'line_break');
    expect(paragraphs).toHaveLength(1);
    expect(lineBreaks).toHaveLength(1);
  });

  it('detects bullet points', () => {
    const result = detectPauses('Intro\n- First item\n- Second item');
    expect(result.pauses.filter((p) => p.type === 'bullet').length).toBeGreaterThanOrEqual(2);
  });

  it('detects numbered list bullets', () => {
    const result = detectPauses('Steps:\n1. Do this\n2. Do that');
    expect(result.pauses.filter((p) => p.type === 'bullet').length).toBeGreaterThanOrEqual(2);
  });

  it('detects ellipses (three dots or the unicode ellipsis char)', () => {
    const result = detectPauses('Well... maybe not… actually');
    expect(result.pauses.filter((p) => p.type === 'ellipsis')).toHaveLength(2);
  });

  it('detects em-dashes and double-hyphen dashes', () => {
    const result = detectPauses('Wait — no, actually -- yes');
    expect(result.pauses.filter((p) => p.type === 'em_dash')).toHaveLength(2);
  });

  it('does not count commas embedded inside numbers like 10,000', () => {
    const result = detectPauses('I have 10,000 dollars, seriously.');
    const commas = result.pauses.filter((p) => p.type === 'comma');
    // Only the comma after "dollars" should count, not the one inside "10,000"
    expect(commas).toHaveLength(1);
  });

  it('counts a real sentence-separating comma', () => {
    const result = detectPauses('First, second, third.');
    expect(result.pauses.filter((p) => p.type === 'comma')).toHaveLength(2);
  });

  it('does not double count a period that is part of an ellipsis', () => {
    const result = detectPauses('Wait...');
    expect(result.pauses.filter((p) => p.type === 'period')).toHaveLength(0);
    expect(result.pauses.filter((p) => p.type === 'ellipsis')).toHaveLength(1);
  });

  it('detects a standalone sentence-ending period', () => {
    const result = detectPauses('This is a sentence.');
    expect(result.pauses.filter((p) => p.type === 'period')).toHaveLength(1);
  });

  it('does not count a period that is part of a decimal number', () => {
    const result = detectPauses('The value is 3.14 exactly');
    expect(result.pauses.filter((p) => p.type === 'period')).toHaveLength(0);
  });

  it('detects colons and semicolons', () => {
    const result = detectPauses('Note: this is true; that is false');
    expect(result.pauses.filter((p) => p.type === 'colon')).toHaveLength(1);
    expect(result.pauses.filter((p) => p.type === 'semicolon')).toHaveLength(1);
  });

  it('sorts pauses by position in ascending order', () => {
    const result = detectPauses('A, B: C; D.');
    const positions = result.pauses.map((p) => p.position);
    const sorted = [...positions].sort((a, b) => a - b);
    expect(positions).toEqual(sorted);
  });

  it('sums pause durations into totalPauseTime and matches pauseCount', () => {
    const result = detectPauses('First, second.');
    const expectedTotal = result.pauses.reduce((sum, p) => sum + p.duration, 0);
    expect(result.totalPauseTime).toBeCloseTo(expectedTotal, 10);
    expect(result.pauseCount).toBe(result.pauses.length);
  });
});

describe('getPauseSummary', () => {
  it('returns an empty object when there are no pauses', () => {
    expect(getPauseSummary({ pauses: [], totalPauseTime: 0, pauseCount: 0 })).toEqual({});
  });

  it('aggregates counts and total time per pause type', () => {
    const analysis = detectPauses('First, second, third.');
    const summary = getPauseSummary(analysis);
    expect(summary.comma.count).toBe(2);
    expect(summary.comma.totalTime).toBeCloseTo(0.6, 5);
    expect(summary.period.count).toBe(1);
  });
});

describe('getPauseTypeName', () => {
  it('returns a human-readable label for every pause type', () => {
    const types: Array<Parameters<typeof getPauseTypeName>[0]> = [
      'line_break',
      'paragraph',
      'bullet',
      'ellipsis',
      'em_dash',
      'stage_direction',
      'comma',
      'period',
      'colon',
      'semicolon',
    ];
    for (const type of types) {
      expect(typeof getPauseTypeName(type)).toBe('string');
      expect(getPauseTypeName(type).length).toBeGreaterThan(0);
    }
  });
});
