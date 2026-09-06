/**
 * Pronunciation Utility
 *
 * Provides phonetic pronunciation lookup using the CMU Pronouncing Dictionary.
 * Returns ARPABET phoneme sequences for English words.
 *
 * ARPABET is the standard phonetic notation used by voice actors and linguists.
 * Stress digits (0/1/2) are kept, matching the dictionary's own notation.
 * Example: "hello" -> "HH AH0 L OW1"
 */

import { dictionary as words } from 'cmu-pronouncing-dictionary';

// Simple in-memory cache for pronunciation lookups
const pronunciationCache = new Map<string, string | null>();

/**
 * Cleans a word for pronunciation lookup
 * - Converts to lowercase (this package uses lowercase keys)
 * - Removes punctuation except apostrophes (for contractions)
 * - Preserves internal structure
 */
function cleanWordForLookup(word: string): string {
  return word
    .toLowerCase()
    .replace(/[^\w']/g, '') // Remove all non-word chars except apostrophes
    .trim();
}

/**
 * Formats ARPABET pronunciation for display
 * - Standard ARPABET notation, unchanged apart from trimming and
 *   collapsing whitespace: uppercase phonemes with stress digits (0/1/2),
 *   separated by single spaces (e.g. "W AO1 R AH0 N T IY0").
 */
function formatArpabet(arpabet: string): string {
  return arpabet.trim().replace(/\s+/g, ' ');
}

/**
 * Attempts to get pronunciation for a word
 * Returns null if pronunciation is not available
 */
function lookupPronunciation(word: string): string | null {
  const cleaned = cleanWordForLookup(word);
  
  if (!cleaned) {
    return null;
  }

  // Check cache first
  if (pronunciationCache.has(cleaned)) {
    return pronunciationCache.get(cleaned)!;
  }

  // Look up in CMU dictionary
  const pronunciation = words[cleaned];
  
  if (pronunciation) {
    const formatted = formatArpabet(pronunciation);
    pronunciationCache.set(cleaned, formatted);
    return formatted;
  }

  // Try without possessive 's
  if (cleaned.endsWith("'s")) {
    const baseWord = cleaned.slice(0, -2);
    const basePronunciation = words[baseWord];
    if (basePronunciation) {
      const formatted = formatArpabet(basePronunciation + ' Z');
      pronunciationCache.set(cleaned, formatted);
      return formatted;
    }
  }

  // Cache the miss to avoid repeated lookups
  pronunciationCache.set(cleaned, null);
  return null;
}

/**
 * Gets pronunciation for a word or phrase
 *
 * @param text - Word or short phrase to get pronunciation for
 * @returns Pronunciation object with the original text and ARPABET phonemes
 *
 * Examples:
 * - "hello" -> { text: "hello", pronunciation: "HH AH0 L OW1" }
 * - "world" -> { text: "world", pronunciation: "W ER1 L D" }
 * - "unknown" -> { text: "unknown", pronunciation: null }
 * - "hello world" -> { text: "hello world", pronunciation: "HH AH0 L OW1 · W ER1 L D" }
 */
export function getPronunciation(text: string): {
  text: string;
  pronunciation: string | null;
  isMultiWord: boolean;
} {
  const trimmed = text.trim();
  
  if (!trimmed) {
    return { text: trimmed, pronunciation: null, isMultiWord: false };
  }

  // Check if multi-word phrase (split by spaces)
  const words = trimmed.split(/\s+/);
  const isMultiWord = words.length > 1;

  if (isMultiWord) {
    // For phrases, get pronunciation of each word
    const pronunciations = words
      .map(word => lookupPronunciation(word))
      .filter(p => p !== null);

    if (pronunciations.length === 0) {
      return { text: trimmed, pronunciation: null, isMultiWord: true };
    }

    return {
      text: trimmed,
      pronunciation: pronunciations.join(' · '),
      isMultiWord: true
    };
  }

  // Single word lookup
  const pronunciation = lookupPronunciation(trimmed);
  return { text: trimmed, pronunciation, isMultiWord: false };
}

/**
 * Checks if a word has an available pronunciation
 */
export function hasPronunciation(text: string): boolean {
  const { pronunciation } = getPronunciation(text);
  return pronunciation !== null;
}

/**
 * Clears the pronunciation cache
 * Useful for testing or memory management
 */
export function clearPronunciationCache(): void {
  pronunciationCache.clear();
}

/**
 * Gets cache statistics
 * Useful for debugging and performance monitoring
 */
export function getCacheStats(): {
  size: number;
  hits: number;
  misses: number;
} {
  const size = pronunciationCache.size;
  let hits = 0;
  let misses = 0;

  pronunciationCache.forEach(value => {
    if (value === null) {
      misses++;
    } else {
      hits++;
    }
  });

  return { size, hits, misses };
}
