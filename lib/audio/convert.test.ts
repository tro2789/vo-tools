import { describe, it, expect, vi, beforeEach } from 'vitest';

// `lib/audio/ffmpeg.ts` promisifies `child_process.execFile`; mirror Node's
// custom promisify shape so the wrappers resolve without spawning FFmpeg.
const { execFileImpl } = vi.hoisted(() => ({ execFileImpl: vi.fn() }));

vi.mock('child_process', () => {
  const PROMISIFY_CUSTOM = Symbol.for('nodejs.util.promisify.custom');
  const execFile = (...args: unknown[]) => execFileImpl(...args);
  (execFile as unknown as Record<symbol, unknown>)[PROMISIFY_CUSTOM] = (...args: unknown[]) =>
    execFileImpl(...args);
  return { execFile };
});

import {
  isAllowedFile,
  isValidFormat,
  isValidVolume,
  sanitizeFilename,
  buildAudioFilters,
  previewInputArgs,
  renderPreview,
  FORMATS,
  EXTENSIONS,
  SUFFIXES,
} from './convert';

beforeEach(() => {
  execFileImpl.mockReset();
  execFileImpl.mockResolvedValue({ stdout: '', stderr: '' });
});

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

describe('previewInputArgs', () => {
  it('describes the raw stream for the headerless sln format', () => {
    expect(previewInputArgs('sln')).toEqual(['-f', 's16le', '-ar', '8000', '-ac', '1']);
  });

  it('returns no input flags for container formats', () => {
    expect(previewInputArgs('ulaw')).toEqual([]);
    expect(previewInputArgs('g722')).toEqual([]);
  });
});

describe('renderPreview', () => {
  it('converts to the target format, then decodes that output to a 16-bit PCM WAV', async () => {
    const previewPath = await renderPreview('/tmp/job/in.wav', '/tmp/job', 'ulaw', [
      'volume=5dB',
    ]);

    expect(previewPath).toBe('/tmp/job/preview.wav');
    expect(execFileImpl).toHaveBeenCalledTimes(2);

    expect(execFileImpl.mock.calls[0][1]).toEqual([
      '-y', '-i', '/tmp/job/in.wav',
      '-af', 'volume=5dB',
      '-ar', '8000', '-ac', '1', '-c:a', 'pcm_mulaw',
      '/tmp/job/preview_source.wav',
    ]);

    expect(execFileImpl.mock.calls[1][1]).toEqual([
      '-y',
      '-i', '/tmp/job/preview_source.wav',
      '-c:a', 'pcm_s16le',
      '-f', 'wav',
      '/tmp/job/preview.wav',
    ]);
  });

  it('passes the raw input format flags on the second pass for sln', async () => {
    await renderPreview('/tmp/job/in.wav', '/tmp/job', 'sln', []);

    expect(execFileImpl.mock.calls[0][1]).toEqual([
      '-y', '-i', '/tmp/job/in.wav',
      '-ar', '8000', '-ac', '1', '-c:a', 'pcm_s16le', '-f', 's16le',
      '/tmp/job/preview_source.sln',
    ]);

    expect(execFileImpl.mock.calls[1][1]).toEqual([
      '-y',
      '-f', 's16le', '-ar', '8000', '-ac', '1',
      '-i', '/tmp/job/preview_source.sln',
      '-c:a', 'pcm_s16le',
      '-f', 'wav',
      '/tmp/job/preview.wav',
    ]);
  });
});
