import { describe, it, expect, vi, beforeEach } from 'vitest';

// lib/audio/ffmpeg.ts wraps `child_process.execFile` with `util.promisify`.
// Node's `execFile` has a custom promisify implementation (registered via the
// well-known `Symbol.for('nodejs.util.promisify.custom')` key) that resolves
// to `{ stdout, stderr }` instead of the raw callback args. We replicate that
// shape here so `promisify(execFile)` inside the module under test resolves
// exactly like the real one would, without ever spawning a real process.
const { execFileImpl } = vi.hoisted(() => ({ execFileImpl: vi.fn() }));

vi.mock('child_process', () => {
  const PROMISIFY_CUSTOM = Symbol.for('nodejs.util.promisify.custom');
  const execFile = (...args: unknown[]) => execFileImpl(...args);
  (execFile as unknown as Record<symbol, unknown>)[PROMISIFY_CUSTOM] = (...args: unknown[]) =>
    execFileImpl(...args);
  return { execFile };
});

import {
  ffprobe,
  isValidAudio,
  getAudioMetadata,
  ffmpegConvert,
  measureLoudness,
  measurePeak,
  detectSilence,
  checkFfmpegAvailable,
} from './ffmpeg';

beforeEach(() => {
  execFileImpl.mockReset();
});

describe('ffprobe', () => {
  it('parses ffprobe JSON stdout', async () => {
    const payload = { streams: [{ codec_type: 'audio' }], format: {} };
    execFileImpl.mockResolvedValue({ stdout: JSON.stringify(payload), stderr: '' });
    const result = await ffprobe('/tmp/file.wav');
    expect(result).toEqual(payload);
  });
});

describe('isValidAudio', () => {
  it('returns true when an audio stream is present', async () => {
    execFileImpl.mockResolvedValue({
      stdout: JSON.stringify({ streams: [{ codec_type: 'audio' }], format: {} }),
      stderr: '',
    });
    expect(await isValidAudio('/tmp/file.wav')).toBe(true);
  });

  it('returns false when no audio stream is present', async () => {
    execFileImpl.mockResolvedValue({
      stdout: JSON.stringify({ streams: [{ codec_type: 'video' }], format: {} }),
      stderr: '',
    });
    expect(await isValidAudio('/tmp/file.mp4')).toBe(false);
  });

  it('returns false (not throw) when ffprobe fails', async () => {
    execFileImpl.mockRejectedValue(new Error('ffprobe: file not found'));
    expect(await isValidAudio('/tmp/missing.wav')).toBe(false);
  });
});

describe('getAudioMetadata', () => {
  it('extracts codec, sample rate, channels, bitrate and duration', async () => {
    execFileImpl.mockResolvedValue({
      stdout: JSON.stringify({
        streams: [
          {
            codec_type: 'audio',
            codec_name: 'mp3',
            sample_rate: '44100',
            channels: 2,
            channel_layout: 'stereo',
            bit_rate: '192000',
          },
        ],
        format: { format_name: 'mp3', duration: '123.45', bit_rate: '192000' },
      }),
      stderr: '',
    });

    const metadata = await getAudioMetadata('/tmp/file.mp3');
    expect(metadata).toEqual({
      codec: 'mp3',
      sampleRate: 44100,
      channels: 2,
      channelLayout: 'stereo',
      bitRate: 192000,
      duration: 123.45,
      format: 'mp3',
    });
  });

  it('falls back to the format-level bit_rate when the stream lacks one', async () => {
    execFileImpl.mockResolvedValue({
      stdout: JSON.stringify({
        streams: [{ codec_type: 'audio', sample_rate: '8000', channels: 1 }],
        format: { format_name: 'wav', duration: '1.0', bit_rate: '128000' },
      }),
      stderr: '',
    });
    const metadata = await getAudioMetadata('/tmp/file.wav');
    expect(metadata.bitRate).toBe(128000);
  });

  it('throws when no audio stream exists', async () => {
    execFileImpl.mockResolvedValue({
      stdout: JSON.stringify({ streams: [{ codec_type: 'video' }], format: {} }),
      stderr: '',
    });
    await expect(getAudioMetadata('/tmp/video.mp4')).rejects.toThrow('No audio stream found in file');
  });
});

describe('ffmpegConvert', () => {
  it('passes args straight through to execFile and returns stdout/stderr', async () => {
    execFileImpl.mockResolvedValue({ stdout: 'ok', stderr: '' });
    const result = await ffmpegConvert(['-y', '-i', 'in.wav', 'out.wav']);
    expect(result).toEqual({ stdout: 'ok', stderr: '' });
    expect(execFileImpl).toHaveBeenCalledWith(
      'ffmpeg',
      ['-y', '-i', 'in.wav', 'out.wav'],
      expect.objectContaining({ timeout: expect.any(Number) })
    );
  });
});

describe('measureLoudness', () => {
  it('parses the integrated loudness (LUFS) from the summary line', async () => {
    const stderr = [
      'Parsed_ebur128_0 Summary:',
      '',
      '  Integrated loudness:',
      '    I:         -19.3 LUFS',
      '    Threshold: -30.0 LUFS',
    ].join('\n');
    execFileImpl.mockResolvedValue({ stdout: '', stderr });
    expect(await measureLoudness('/tmp/file.wav')).toBeCloseTo(-19.3, 5);
  });

  it('reads from the last matching summary line, ignoring earlier per-frame lines', async () => {
    const stderr = [
      't: 1 M: -25 S: -25 I: -25.0 LUFS',
      't: 2 M: -20 S: -20 I: -20.0 LUFS',
      'Summary:',
      '  I:         -18.2 LUFS',
    ].join('\n');
    execFileImpl.mockResolvedValue({ stdout: '', stderr });
    expect(await measureLoudness('/tmp/file.wav')).toBeCloseTo(-18.2, 5);
  });

  it('throws when no LUFS value can be found in the output', async () => {
    execFileImpl.mockResolvedValue({ stdout: '', stderr: 'no useful output here' });
    await expect(measureLoudness('/tmp/file.wav')).rejects.toThrow(
      'Could not extract integrated loudness from FFmpeg output'
    );
  });
});

describe('measurePeak', () => {
  it('returns the maximum peak level across all channels', async () => {
    const stderr = [
      'Channel: 1',
      'Peak level dB: -6.5',
      'Channel: 2',
      'Peak level dB: -2.1',
      'Overall',
      'Peak level dB: -2.1',
    ].join('\n');
    execFileImpl.mockResolvedValue({ stdout: '', stderr });
    expect(await measurePeak('/tmp/file.wav')).toBeCloseTo(-2.1, 5);
  });

  it('throws when no peak level can be found', async () => {
    execFileImpl.mockResolvedValue({ stdout: '', stderr: 'nothing useful' });
    await expect(measurePeak('/tmp/file.wav')).rejects.toThrow(
      'Could not extract peak level from FFmpeg output'
    );
  });
});

describe('detectSilence', () => {
  it('detects leading silence starting at position 0', async () => {
    execFileImpl
      // getAudioMetadata call inside detectSilence
      .mockResolvedValueOnce({
        stdout: JSON.stringify({
          streams: [{ codec_type: 'audio' }],
          format: { duration: '10.0' },
        }),
        stderr: '',
      })
      // silencedetect call
      .mockResolvedValueOnce({
        stdout: '',
        stderr: '[silencedetect] silence_start: 0\n[silencedetect] silence_end: 1.5 | silence_duration: 1.5',
      });

    const [lead, trail] = await detectSilence('/tmp/file.wav');
    expect(lead).toBeCloseTo(1.5, 2);
    expect(trail).toBe(0);
  });

  it('detects trailing silence ending at the file duration', async () => {
    execFileImpl
      .mockResolvedValueOnce({
        stdout: JSON.stringify({
          streams: [{ codec_type: 'audio' }],
          format: { duration: '10.0' },
        }),
        stderr: '',
      })
      .mockResolvedValueOnce({
        stdout: '',
        stderr: '[silencedetect] silence_start: 8.0\n[silencedetect] silence_end: 10.0 | silence_duration: 2.0',
      });

    const [lead, trail] = await detectSilence('/tmp/file.wav');
    expect(lead).toBe(0);
    expect(trail).toBeCloseTo(2.0, 2);
  });

  it('handles silence that extends to the end of the file without an explicit silence_end', async () => {
    execFileImpl
      .mockResolvedValueOnce({
        stdout: JSON.stringify({
          streams: [{ codec_type: 'audio' }],
          format: { duration: '5.0' },
        }),
        stderr: '',
      })
      .mockResolvedValueOnce({
        stdout: '',
        stderr: '[silencedetect] silence_start: 4.0',
      });

    const [, trail] = await detectSilence('/tmp/file.wav');
    expect(trail).toBeCloseTo(1.0, 2);
  });

  it('returns [0, 0] when there is no silence at all', async () => {
    execFileImpl
      .mockResolvedValueOnce({
        stdout: JSON.stringify({
          streams: [{ codec_type: 'audio' }],
          format: { duration: '5.0' },
        }),
        stderr: '',
      })
      .mockResolvedValueOnce({ stdout: '', stderr: 'no silence detected here' });

    const [lead, trail] = await detectSilence('/tmp/file.wav');
    expect(lead).toBe(0);
    expect(trail).toBe(0);
  });
});

describe('checkFfmpegAvailable', () => {
  it('returns true when ffmpeg -version succeeds', async () => {
    execFileImpl.mockResolvedValue({ stdout: 'ffmpeg version 6.0', stderr: '' });
    expect(await checkFfmpegAvailable()).toBe(true);
  });

  it('returns false when ffmpeg is not found', async () => {
    execFileImpl.mockRejectedValue(new Error('command not found: ffmpeg'));
    expect(await checkFfmpegAvailable()).toBe(false);
  });
});
