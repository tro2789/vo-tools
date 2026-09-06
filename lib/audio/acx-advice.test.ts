import { describe, it, expect } from 'vitest';
import { buildAcxAdvice } from './acx-advice';
import type { ACXResult } from '@/lib/types/acx';

const PASSING_RESULT: ACXResult = {
  format: { value: 'mp3', codec: 'mp3', bitrate: 192000, bitrate_kbps: 192, cbr: true, ok: true, is_mp3: true, message: 'MP3 @ 192kbps CBR' },
  sampleRate: { value: 44100, ok: true, required: 44100, message: '44100 Hz' },
  rms: { value: -20, ok: true, range: [-23, -18], message: '-20 dB' },
  peak: { value: -4, ok: true, max: -3, message: '-4 dB' },
  silence: { lead: 0, trail: 0, message: '0s lead, 0s trail' },
  duration: 60,
  channels: 'mono',
  overallPass: true,
  summary: 'ACX Compliant',
};

/** Deep-clones the passing result and overrides only the fields under test, flipping overallPass. */
function failingResult(overrides: Partial<ACXResult>): ACXResult {
  return {
    ...structuredClone(PASSING_RESULT),
    ...overrides,
    overallPass: false,
  };
}

describe('buildAcxAdvice', () => {
  it('returns an empty array when overallPass is true', () => {
    expect(buildAcxAdvice(PASSING_RESULT)).toEqual([]);
  });

  it('advises exporting as MP3 when the file is not MP3', () => {
    const result = failingResult({
      format: { value: 'wav', codec: 'pcm_s16le', bitrate: 1411000, bitrate_kbps: 1411, cbr: true, ok: false, is_mp3: false, message: 'wav' },
    });
    const advice = buildAcxAdvice(result);
    expect(advice[0]).toEqual({
      check: 'format',
      title: 'Export as MP3',
      detail: 'ACX accepts MP3 only. Export from your editor as MP3, 192 kbps or higher, constant bit rate.',
    });
  });

  it('advises constant bit rate when the MP3 is VBR', () => {
    const result = failingResult({
      format: { value: 'mp3', codec: 'mp3', bitrate: 256000, bitrate_kbps: 256, cbr: false, ok: false, is_mp3: true, message: 'MP3 @ 256kbps VBR' },
    });
    const advice = buildAcxAdvice(result);
    expect(advice[0].title).toBe('Use constant bit rate');
    expect(advice[0].detail).toContain('CBR');
    expect(advice[0].detail).toContain('192 kbps or higher');
  });

  it('advises raising the bit rate with the real number when MP3 CBR is under 192 kbps', () => {
    const result = failingResult({
      format: { value: 'mp3', codec: 'mp3', bitrate: 128000, bitrate_kbps: 128, cbr: true, ok: false, is_mp3: true, message: 'MP3 @ 128kbps CBR' },
    });
    const advice = buildAcxAdvice(result);
    expect(advice[0]).toEqual({
      check: 'format',
      title: 'Raise the bit rate',
      detail: 'Currently 128 kbps. Re-export at 192 kbps or higher, constant bit rate.',
    });
  });

  it('advises resampling to 44.1 kHz, formatting the current rate with no trailing zeros', () => {
    const result = failingResult({
      sampleRate: { value: 22050, ok: false, required: 44100, message: '22050 Hz' },
    });
    const advice = buildAcxAdvice(result);
    expect(advice[0]).toEqual({
      check: 'sampleRate',
      title: 'Resample to 44.1 kHz',
      detail: 'Currently 22.05 kHz. Set the project or export sample rate to 44100 Hz before encoding.',
    });
  });

  it('advises raising the level when RMS is below the window, with the midpoint delta', () => {
    const result = failingResult({
      rms: { value: -26.4, ok: false, range: [-23, -18], message: '-26.4 dB' },
    });
    const advice = buildAcxAdvice(result);
    expect(advice[0]).toEqual({
      check: 'rms',
      title: 'Raise the overall level',
      detail:
        'RMS is −26.4 dB. Raise gain by about 5.9 dB to land near −20.5 dB (the middle of the −23 to −18 window), then re-check peaks.',
    });
  });

  it('advises lowering the level when RMS is above the window, with the midpoint delta', () => {
    const result = failingResult({
      rms: { value: -15.1, ok: false, range: [-23, -18], message: '-15.1 dB' },
    });
    const advice = buildAcxAdvice(result);
    expect(advice[0]).toEqual({
      check: 'rms',
      title: 'Lower the overall level',
      detail:
        'RMS is −15.1 dB. Lower gain by about 5.4 dB to land near −20.5 dB (the middle of the −23 to −18 window), then re-check peaks.',
    });
  });

  it('advises limiting the peaks with a ceiling and a margin figure', () => {
    const result = failingResult({
      peak: { value: -1.9, ok: false, max: -3, message: '-1.9 dB' },
    });
    const advice = buildAcxAdvice(result);
    expect(advice[advice.length - 1]).toEqual({
      check: 'peak',
      title: 'Limit the peaks',
      detail:
        'Peak is −1.9 dB. Apply a limiter with a ceiling of −3.0 dB (−3.5 dB leaves a margin). If you also raise gain for RMS, limit after the gain change.',
    });
  });

  it('adds a limiter note to the RMS advice when RMS is low and peak is also high', () => {
    const result = failingResult({
      rms: { value: -26.4, ok: false, range: [-23, -18], message: '-26.4 dB' },
      peak: { value: -1.9, ok: false, max: -3, message: '-1.9 dB' },
    });
    const advice = buildAcxAdvice(result);
    const rmsAdvice = advice.find((a) => a.check === 'rms');
    expect(rmsAdvice?.detail).toContain(
      'Raising gain will push peaks higher; use a limiter or compression rather than plain gain.'
    );
  });

  it('does not add the limiter note when RMS is high (not low) even if peak also fails', () => {
    const result = failingResult({
      rms: { value: -15.1, ok: false, range: [-23, -18], message: '-15.1 dB' },
      peak: { value: -1.9, ok: false, max: -3, message: '-1.9 dB' },
    });
    const advice = buildAcxAdvice(result);
    const rmsAdvice = advice.find((a) => a.check === 'rms');
    expect(rmsAdvice?.detail).not.toContain('Raising gain will push peaks higher');
  });

  it('orders advice as format, sampleRate, rms, peak when everything fails', () => {
    const result = failingResult({
      format: { value: 'wav', codec: 'pcm_s16le', bitrate: 1411000, bitrate_kbps: 1411, cbr: true, ok: false, is_mp3: false, message: 'wav' },
      sampleRate: { value: 22050, ok: false, required: 44100, message: '22050 Hz' },
      rms: { value: -26.4, ok: false, range: [-23, -18], message: '-26.4 dB' },
      peak: { value: -1.9, ok: false, max: -3, message: '-1.9 dB' },
    });
    const advice = buildAcxAdvice(result);
    expect(advice.map((a) => a.check)).toEqual(['format', 'sampleRate', 'rms', 'peak']);
  });
});
