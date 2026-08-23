import { describe, it, expect } from 'vitest';
import {
  isAllowedFile,
  isValidFormat,
  isValidVolume,
  sanitizeFilename,
  buildAudioFilters,
  FORMATS,
  EXTENSIONS,
  SUFFIXES,
} from './convert';

describe('isAllowedFile', () => {
  it('allows a file with a default-allowed extension', () => {
    expect(isAllowedFile('voice.wav')).toBe(true);
    expect(isAllowedFile('voice.mp3')).toBe(true);
  });

  it('is case-insensitive for extensions', () => {
    expect(isAllowedFile('voice.WAV')).toBe(true);
    expect(isAllowedFile('voice.Mp3')).toBe(true);
  });

  it('rejects disallowed extensions', () => {
    expect(isAllowedFile('script.exe')).toBe(false);
    expect(isAllowedFile('document.pdf')).toBe(false);
  });

  it('rejects a filename with no extension', () => {
    expect(isAllowedFile('noextension')).toBe(false);
  });

  it('rejects an empty filename', () => {
    expect(isAllowedFile('')).toBe(false);
  });
});

describe('isValidFormat', () => {
  it('accepts every key defined in FORMATS', () => {
    for (const format of Object.keys(FORMATS)) {
      expect(isValidFormat(format)).toBe(true);
    }
  });

  it('rejects an unknown format', () => {
    expect(isValidFormat('not_a_real_format')).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(isValidFormat('')).toBe(false);
  });
});

describe('isValidVolume', () => {
  it('accepts all known volume levels', () => {
    for (const level of ['quiet', 'lower', 'medium', 'high', 'max']) {
      expect(isValidVolume(level)).toBe(true);
    }
  });

  it('rejects an unknown volume level', () => {
    expect(isValidVolume('loud')).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(isValidVolume('')).toBe(false);
  });
});

describe('sanitizeFilename', () => {
  it('leaves a normal filename unchanged', () => {
    expect(sanitizeFilename('audio_file.wav')).toBe('audio_file.wav');
  });

  it('strips path traversal sequences', () => {
    const result = sanitizeFilename('../../etc/passwd');
    expect(result).not.toContain('..');
    expect(result).not.toContain('/');
  });

  it('strips path separators from an absolute path, keeping only the basename', () => {
    const result = sanitizeFilename('/var/tmp/../secret.wav');
    expect(result).not.toContain('/');
    expect(result).not.toContain('..');
  });

  it('strips backslashes (Windows-style separators)', () => {
    const result = sanitizeFilename('C:\\Users\\evil\\file.wav');
    expect(result).not.toContain('\\');
  });

  it('truncates a filename longer than 255 characters while preserving the extension', () => {
    const longName = 'a'.repeat(300) + '.wav';
    const result = sanitizeFilename(longName);
    expect(result.length).toBeLessThanOrEqual(255);
    expect(result.endsWith('.wav')).toBe(true);
  });

  it('handles an empty filename without throwing', () => {
    expect(() => sanitizeFilename('')).not.toThrow();
  });
});

describe('buildAudioFilters', () => {
  it('returns no filters for medium volume with optimize disabled', () => {
    expect(buildAudioFilters('medium', false)).toEqual([]);
  });

  it('adds a negative volume filter for "quiet"', () => {
    expect(buildAudioFilters('quiet', false)).toEqual(['volume=-10dB']);
  });

  it('adds a smaller negative volume filter for "lower"', () => {
    expect(buildAudioFilters('lower', false)).toEqual(['volume=-5dB']);
  });

  it('adds a positive volume filter for "high"', () => {
    expect(buildAudioFilters('high', false)).toEqual(['volume=5dB']);
  });

  it('adds a loudness normalization filter for "max"', () => {
    expect(buildAudioFilters('max', false)).toEqual(['loudnorm=I=-16:TP=-1.5:LRA=11']);
  });

  it('appends a bandpass filter when optimize is enabled', () => {
    const filters = buildAudioFilters('medium', true);
    expect(filters).toEqual(['highpass=f=300,lowpass=f=3400']);
  });

  it('combines volume and optimize filters in order', () => {
    const filters = buildAudioFilters('high', true);
    expect(filters).toEqual(['volume=5dB', 'highpass=f=300,lowpass=f=3400']);
  });
});

describe('format/extension/suffix maps stay in sync', () => {
  it('has an extension entry for every format', () => {
    for (const format of Object.keys(FORMATS)) {
      expect(EXTENSIONS[format]).toBeDefined();
    }
  });

  it('has a suffix entry for every format', () => {
    for (const format of Object.keys(FORMATS)) {
      expect(SUFFIXES[format]).toBeDefined();
    }
  });
});
