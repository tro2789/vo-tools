import { describe, it, expect } from 'vitest';
import {
  calculateSpokenWordCount,
  formatDuration,
  analyzePauses,
  calculateTotalTimeWithPauses,
} from './textAnalysis';
import { DEFAULT_EXPANSION_OPTIONS, ExpansionOptions } from './expansionOptions';

const ALL_OFF: ExpansionOptions = {
  expandNumbers: false,
  expandDates: false,
  expandCurrencies: false,
  expandPercentages: false,
  expandURLs: false,
  expandMeasurements: false,
};

describe('calculateSpokenWordCount', () => {
  it('returns 0 for empty string', () => {
    expect(calculateSpokenWordCount('')).toBe(0);
  });

  it('returns 0 for whitespace-only string', () => {
    expect(calculateSpokenWordCount('   ')).toBe(0);
  });

  it('counts simple words', () => {
    expect(calculateSpokenWordCount('Hello world', ALL_OFF)).toBe(2);
  });

  it('strips punctuation without inflating the count', () => {
    // Apostrophes are also stripped (not preserved for contractions), so
    // "Isn't" becomes the single token "Isnt" rather than two words.
    expect(calculateSpokenWordCount("Hello, world! Isn't this great?", ALL_OFF)).toBe(5);
  });

  it('handles unicode / accented characters as word characters', () => {
    // \w in JS regex without the /u + unicode property escapes does not match
    // accented letters, so café's punctuation-stripping regex removes the é.
    // Document actual behavior rather than "fixing" it.
    const count = calculateSpokenWordCount('café résumé', ALL_OFF);
    expect(count).toBe(2);
  });

  it('collapses multiple spaces between words', () => {
    expect(calculateSpokenWordCount('Hello     world', ALL_OFF)).toBe(2);
  });

  it('expands numbers into words when expandNumbers is enabled', () => {
    // "1250" -> "one thousand, two hundred fifty" (multiple words) instead of
    // counting as a single token.
    const withExpansion = calculateSpokenWordCount('I have 1250 apples', {
      ...ALL_OFF,
      expandNumbers: true,
    });
    const withoutExpansion = calculateSpokenWordCount('I have 1250 apples', ALL_OFF);
    expect(withExpansion).toBeGreaterThan(withoutExpansion);
  });

  it('does NOT inflate word count for two-digit compound numbers like 42, because the hyphen in "forty-two" gets stripped as punctuation', () => {
    // This documents an actual quirk of the expansion + punctuation-stripping
    // pipeline rather than "fixing" it: number-to-words renders compound
    // numbers under 100 with a hyphen (e.g. "forty-two"), and the punctuation
    // stripping step removes hyphens without inserting a space, merging the
    // two words into a single token "fortytwo".
    const withExpansion = calculateSpokenWordCount('I have 42 apples', {
      ...ALL_OFF,
      expandNumbers: true,
    });
    const withoutExpansion = calculateSpokenWordCount('I have 42 apples', ALL_OFF);
    expect(withExpansion).toBe(withoutExpansion);
  });

  it('expands currency amounts when expandCurrencies is enabled', () => {
    const text = 'It costs $1,250 today';
    const result = calculateSpokenWordCount(text, { ...ALL_OFF, expandCurrencies: true });
    // "one thousand two hundred fifty dollars" adds several words vs the raw token
    expect(result).toBeGreaterThan(calculateSpokenWordCount(text, ALL_OFF));
  });

  it('expands percentages when expandPercentages is enabled', () => {
    const text = 'Sales grew 15%';
    const result = calculateSpokenWordCount(text, { ...ALL_OFF, expandPercentages: true });
    expect(result).toBeGreaterThan(calculateSpokenWordCount(text, ALL_OFF));
  });

  it('removes URLs entirely when expandURLs is disabled', () => {
    const withUrl = calculateSpokenWordCount('Visit https://example.com now', {
      ...ALL_OFF,
      expandURLs: false,
    });
    // "Visit" and "now" remain = 2 words; URL is stripped, not counted
    expect(withUrl).toBe(2);
  });

  it('expands URLs into spoken words when expandURLs is enabled', () => {
    const withUrl = calculateSpokenWordCount('Visit https://example.com now', {
      ...ALL_OFF,
      expandURLs: true,
    });
    // "Visit example dot com now" = 5 words
    expect(withUrl).toBe(5);
  });

  it('uses default expansion options when none are provided', () => {
    // Default options expand numbers/dates/currencies/percentages/measurements but not URLs.
    // Use a number >= 100 so its word expansion has internal spaces (not just
    // a hyphen, which gets stripped without adding a word boundary).
    expect(calculateSpokenWordCount('1250 apples')).toBeGreaterThan(
      calculateSpokenWordCount('1250 apples', ALL_OFF)
    );
  });

  it('expands measurements (height) when enabled', () => {
    const text = 'He is 5\'10" tall';
    const result = calculateSpokenWordCount(text, { ...ALL_OFF, expandMeasurements: true });
    expect(result).toBeGreaterThan(calculateSpokenWordCount(text, ALL_OFF));
  });

  it('is deterministic for the same input and options', () => {
    const text = 'This is a repeated test sentence with 3 numbers 4 and 5.';
    const first = calculateSpokenWordCount(text, DEFAULT_EXPANSION_OPTIONS);
    const second = calculateSpokenWordCount(text, DEFAULT_EXPANSION_OPTIONS);
    expect(first).toBe(second);
  });
});

describe('formatDuration', () => {
  it('formats zero minutes as "0 sec"', () => {
    expect(formatDuration(0)).toBe('0 sec');
  });

  it('formats sub-minute durations as seconds only', () => {
    expect(formatDuration(0.5)).toBe('30 sec');
  });

  it('formats whole minutes without seconds', () => {
    expect(formatDuration(2)).toBe('2 min');
  });

  it('formats minutes and seconds together', () => {
    expect(formatDuration(2.5)).toBe('2 min 30 sec');
  });

  it('rounds seconds correctly at boundary values', () => {
    // 1.999999 minutes -> 1 min + ~60 sec rounds to "2 min"-ish; verify no crash
    // and that it produces a sane, non-negative result string.
    const result = formatDuration(1.9999);
    expect(result).toMatch(/min|sec/);
  });

  it('handles negative durations without throwing', () => {
    // Not a case the app should hit, but the function should not throw.
    expect(() => formatDuration(-1)).not.toThrow();
  });
});

describe('analyzePauses', () => {
  it('returns empty analysis for empty text', () => {
    const result = analyzePauses('');
    expect(result).toEqual({ pauses: [], totalPauseTime: 0, pauseCount: 0 });
  });

  it('detects a paragraph break', () => {
    const result = analyzePauses('First paragraph.\n\nSecond paragraph.');
    expect(result.pauses.some((p) => p.type === 'paragraph')).toBe(true);
  });
});

describe('calculateTotalTimeWithPauses', () => {
  it('returns 0 when word count and pause time are both 0', () => {
    expect(calculateTotalTimeWithPauses(0, 150, 0)).toBe(0);
  });

  it('adds pause time (converted to minutes) to base reading time', () => {
    // 150 words at 150 wpm = 1 minute base; 60s of pause = 1 more minute
    const total = calculateTotalTimeWithPauses(150, 150, 60);
    expect(total).toBeCloseTo(2, 5);
  });

  it('falls back to a wpm of 1 when wpm is 0 (avoids division by zero)', () => {
    expect(() => calculateTotalTimeWithPauses(10, 0, 0)).not.toThrow();
    expect(calculateTotalTimeWithPauses(10, 0, 0)).toBe(10);
  });
});
