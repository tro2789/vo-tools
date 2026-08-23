import { describe, it, expect } from 'vitest';
import { compareTexts } from './textComparison';

const flatten = (segments: { value: string }[]) => segments.map((s) => s.value).join('');

describe('compareTexts', () => {
  it('returns empty segments when both texts are empty', () => {
    const { originalSegments, revisedSegments } = compareTexts('', '');
    expect(originalSegments).toEqual([]);
    expect(revisedSegments).toEqual([]);
  });

  it('marks identical texts as fully unchanged', () => {
    const { originalSegments, revisedSegments } = compareTexts('hello world', 'hello world');
    expect(originalSegments.every((s) => s.type === 'unchanged')).toBe(true);
    expect(revisedSegments.every((s) => s.type === 'unchanged')).toBe(true);
    expect(flatten(originalSegments)).toBe('hello world');
  });

  it('detects a pure addition', () => {
    const { originalSegments, revisedSegments } = compareTexts('hello', 'hello world');
    expect(flatten(originalSegments)).toBe('hello');
    expect(revisedSegments.some((s) => s.type === 'added')).toBe(true);
    expect(flatten(revisedSegments)).toBe('hello world');
  });

  it('detects a pure removal', () => {
    const { originalSegments, revisedSegments } = compareTexts('hello world', 'hello');
    expect(originalSegments.some((s) => s.type === 'removed')).toBe(true);
    expect(flatten(revisedSegments)).toBe('hello');
  });

  it('detects a word substitution as removed+added rather than unchanged', () => {
    const { originalSegments, revisedSegments } = compareTexts('The cat sat', 'The dog sat');
    expect(originalSegments.some((s) => s.type === 'removed' && s.value.includes('cat'))).toBe(true);
    expect(revisedSegments.some((s) => s.type === 'added' && s.value.includes('dog'))).toBe(true);
    // "The " and " sat" should still be recognized as unchanged
    expect(originalSegments.some((s) => s.type === 'unchanged')).toBe(true);
  });

  it('handles one empty string against a non-empty string', () => {
    const { originalSegments, revisedSegments } = compareTexts('', 'brand new text');
    expect(originalSegments).toEqual([]);
    expect(flatten(revisedSegments)).toBe('brand new text');
    expect(revisedSegments.every((s) => s.type === 'added')).toBe(true);
  });

  it('reconstructs the original and revised text exactly from segments', () => {
    const original = 'Quick brown fox jumps over the lazy dog.';
    const revised = 'Quick red fox jumps over the sleeping dog!';
    const { originalSegments, revisedSegments } = compareTexts(original, revised);
    expect(flatten(originalSegments)).toBe(original);
    expect(flatten(revisedSegments)).toBe(revised);
  });

  it('merges consecutive segments of the same type', () => {
    const { revisedSegments } = compareTexts('a', 'a b c');
    // "a" unchanged, then " b c" added as new words+whitespace should merge into
    // as few "added" segments as possible rather than one per token.
    const addedSegments = revisedSegments.filter((s) => s.type === 'added');
    expect(addedSegments.length).toBeLessThanOrEqual(1);
  });
});
