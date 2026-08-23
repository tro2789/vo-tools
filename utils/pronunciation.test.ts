import { describe, it, expect, beforeEach } from 'vitest';
import {
  getPronunciation,
  hasPronunciation,
  clearPronunciationCache,
  getCacheStats,
} from './pronunciation';

describe('getPronunciation', () => {
  beforeEach(() => {
    clearPronunciationCache();
  });

  it('returns null pronunciation and empty text for an empty string', () => {
    const result = getPronunciation('');
    expect(result).toEqual({ text: '', pronunciation: null, isMultiWord: false });
  });

  it('returns null pronunciation for a whitespace-only string', () => {
    const result = getPronunciation('   ');
    expect(result.pronunciation).toBeNull();
  });

  it('looks up a known common word and returns hyphenated ARPABET without stress markers', () => {
    const result = getPronunciation('hello');
    expect(result.pronunciation).not.toBeNull();
    expect(result.pronunciation).not.toMatch(/[0-2]/);
    expect(result.pronunciation).toContain('-');
    expect(result.isMultiWord).toBe(false);
  });

  it('is case-insensitive when looking up words', () => {
    const lower = getPronunciation('hello');
    const upper = getPronunciation('HELLO');
    expect(upper.pronunciation).toBe(lower.pronunciation);
  });

  it('returns null pronunciation for a made-up, non-dictionary word', () => {
    const result = getPronunciation('zxqvblorptrix');
    expect(result.pronunciation).toBeNull();
  });

  it('detects multi-word phrases and joins per-word pronunciations with a space', () => {
    const result = getPronunciation('hello world');
    expect(result.isMultiWord).toBe(true);
    if (result.pronunciation) {
      expect(result.pronunciation.split(' ')).toHaveLength(2);
    }
  });

  it('trims surrounding whitespace from the input text', () => {
    const result = getPronunciation('  hello  ');
    expect(result.text).toBe('hello');
  });

  it('falls back to stripping a possessive "\'s" suffix when the possessive form is not itself in the dictionary', () => {
    // "wizard's" has no direct CMU dictionary entry, so lookupPronunciation
    // falls back to "wizard" + a trailing Z sound.
    const base = getPronunciation('wizard');
    const possessive = getPronunciation("wizard's");
    expect(base.pronunciation).not.toBeNull();
    expect(possessive.pronunciation).toBe(`${base.pronunciation}-z`);
  });

  it('uses the dictionary\'s own possessive entry directly when one exists', () => {
    // "cat's" IS in the CMU dictionary directly (K AE1 T S), so the fallback
    // Z-suffix logic never runs for it.
    const result = getPronunciation("cat's");
    expect(result.pronunciation).toBe('k-ae-t-s');
  });
});

describe('hasPronunciation', () => {
  beforeEach(() => {
    clearPronunciationCache();
  });

  it('returns true for a known word', () => {
    expect(hasPronunciation('hello')).toBe(true);
  });

  it('returns false for an unknown word', () => {
    expect(hasPronunciation('zxqvblorptrix')).toBe(false);
  });

  it('returns false for empty input', () => {
    expect(hasPronunciation('')).toBe(false);
  });
});

describe('pronunciation cache', () => {
  beforeEach(() => {
    clearPronunciationCache();
  });

  it('starts empty after clearPronunciationCache', () => {
    expect(getCacheStats()).toEqual({ size: 0, hits: 0, misses: 0 });
  });

  it('records a hit after looking up a known word', () => {
    getPronunciation('hello');
    const stats = getCacheStats();
    expect(stats.hits).toBe(1);
    expect(stats.size).toBe(1);
  });

  it('records a miss after looking up an unknown word', () => {
    getPronunciation('zxqvblorptrix');
    const stats = getCacheStats();
    expect(stats.misses).toBe(1);
  });

  it('does not grow the cache on repeated lookups of the same word', () => {
    getPronunciation('hello');
    getPronunciation('hello');
    getPronunciation('hello');
    expect(getCacheStats().size).toBe(1);
  });
});
