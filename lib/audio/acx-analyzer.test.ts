import { describe, it, expect, vi, beforeEach } from 'vitest';

// analyzeAcxCompliance calls out to real FFmpeg/FFprobe via lib/audio/ffmpeg.
// Mock that whole module so tests exercise only the pass/fail decision logic
// in acx-analyzer.ts, never spawning a real process.
vi.mock('./ffmpeg', () => ({
  getAudioMetadata: vi.fn(),
  ffprobe: vi.fn(),
  measureLoudness: vi.fn(),
  measurePeak: vi.fn(),
  detectSilence: vi.fn(),
}));

import { analyzeAcxCompliance } from './acx-analyzer';
import { getAudioMetadata, ffprobe, measureLoudness, measurePeak, detectSilence } from './ffmpeg';

const mockedGetAudioMetadata = vi.mocked(getAudioMetadata);
const mockedFfprobe = vi.mocked(ffprobe);
const mockedMeasureLoudness = vi.mocked(measureLoudness);
const mockedMeasurePeak = vi.mocked(measurePeak);
const mockedDetectSilence = vi.mocked(detectSilence);

const COMPLIANT_METADATA = {
  codec: 'mp3',
  sampleRate: 44100,
  channels: 1,
  channelLayout: 'mono',
  bitRate: 192000,
  duration: 60.0,
  format: 'mp3',
};

function setupCompliantMocks() {
  mockedGetAudioMetadata.mockResolvedValue({ ...COMPLIANT_METADATA });
  mockedFfprobe.mockResolvedValue({
    streams: [{ codec_type: 'audio', bit_rate: '192000' }],
    format: { bit_rate: '192000' },
  });
  mockedMeasureLoudness.mockResolvedValue(-20.0); // within -23..-18
  mockedMeasurePeak.mockResolvedValue(-4.0); // <= -3
  mockedDetectSilence.mockResolvedValue([0, 0]);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('analyzeAcxCompliance', () => {
  it('passes overall compliance when every spec is met', async () => {
    setupCompliantMocks();
    const result = await analyzeAcxCompliance('/tmp/good.mp3');
    expect(result.overallPass).toBe(true);
    expect(result.summary).toBe('ACX Compliant');
    expect(result.format.ok).toBe(true);
    expect(result.sampleRate.ok).toBe(true);
    expect(result.rms.ok).toBe(true);
    expect(result.peak.ok).toBe(true);
  });

  it('fails when bitrate is below the 192kbps minimum', async () => {
    setupCompliantMocks();
    mockedGetAudioMetadata.mockResolvedValue({ ...COMPLIANT_METADATA, bitRate: 128000 });
    const result = await analyzeAcxCompliance('/tmp/low-bitrate.mp3');
    expect(result.format.ok).toBe(false);
    expect(result.overallPass).toBe(false);
    expect(result.summary).toBe('Not ACX Compliant');
  });

  it('fails when sample rate is not exactly 44100 Hz', async () => {
    setupCompliantMocks();
    mockedGetAudioMetadata.mockResolvedValue({ ...COMPLIANT_METADATA, sampleRate: 48000 });
    const result = await analyzeAcxCompliance('/tmp/wrong-rate.mp3');
    expect(result.sampleRate.ok).toBe(false);
    expect(result.overallPass).toBe(false);
  });

  it('fails when integrated loudness is below the -23 LUFS floor', async () => {
    setupCompliantMocks();
    mockedMeasureLoudness.mockResolvedValue(-25.0);
    const result = await analyzeAcxCompliance('/tmp/too-quiet.mp3');
    expect(result.rms.ok).toBe(false);
    expect(result.overallPass).toBe(false);
  });

  it('fails when integrated loudness is above the -18 LUFS ceiling', async () => {
    setupCompliantMocks();
    mockedMeasureLoudness.mockResolvedValue(-15.0);
    const result = await analyzeAcxCompliance('/tmp/too-loud.mp3');
    expect(result.rms.ok).toBe(false);
    expect(result.overallPass).toBe(false);
  });

  it('passes at the exact -23 and -18 LUFS boundary values (inclusive range)', async () => {
    setupCompliantMocks();
    mockedMeasureLoudness.mockResolvedValue(-23.0);
    const lowBoundary = await analyzeAcxCompliance('/tmp/boundary-low.mp3');
    expect(lowBoundary.rms.ok).toBe(true);

    mockedMeasureLoudness.mockResolvedValue(-18.0);
    const highBoundary = await analyzeAcxCompliance('/tmp/boundary-high.mp3');
    expect(highBoundary.rms.ok).toBe(true);
  });

  it('fails when peak amplitude exceeds -3 dB', async () => {
    setupCompliantMocks();
    mockedMeasurePeak.mockResolvedValue(-1.0);
    const result = await analyzeAcxCompliance('/tmp/too-hot.mp3');
    expect(result.peak.ok).toBe(false);
    expect(result.overallPass).toBe(false);
  });

  it('passes at the exact -3 dB peak boundary (inclusive)', async () => {
    setupCompliantMocks();
    mockedMeasurePeak.mockResolvedValue(-3.0);
    const result = await analyzeAcxCompliance('/tmp/boundary-peak.mp3');
    expect(result.peak.ok).toBe(true);
  });

  it('treats a non-MP3 format as failing the format check even if bitrate/CBR would pass', async () => {
    setupCompliantMocks();
    mockedGetAudioMetadata.mockResolvedValue({ ...COMPLIANT_METADATA, format: 'wav', codec: 'pcm_s16le' });
    const result = await analyzeAcxCompliance('/tmp/not-mp3.wav');
    expect(result.format.is_mp3).toBe(false);
    expect(result.format.ok).toBe(false);
    expect(result.overallPass).toBe(false);
  });

  it('reports mono/stereo/other channel counts as human-readable strings', async () => {
    setupCompliantMocks();
    mockedGetAudioMetadata.mockResolvedValue({ ...COMPLIANT_METADATA, channels: 2 });
    const stereo = await analyzeAcxCompliance('/tmp/stereo.mp3');
    expect(stereo.channels).toBe('stereo');

    mockedGetAudioMetadata.mockResolvedValue({ ...COMPLIANT_METADATA, channels: 6 });
    const surround = await analyzeAcxCompliance('/tmp/surround.mp3');
    expect(surround.channels).toBe('6 channels');
  });

  it('includes lead/trail silence measurements in the result', async () => {
    setupCompliantMocks();
    mockedDetectSilence.mockResolvedValue([1.25, 0.5]);
    const result = await analyzeAcxCompliance('/tmp/silence.mp3');
    expect(result.silence.lead).toBe(1.25);
    expect(result.silence.trail).toBe(0.5);
    expect(result.silence.message).toBe('1.25s lead, 0.5s trail');
  });

  it('treats a VBR MP3 (bitrate variation >= 5%) as non-compliant even with a high average bitrate', async () => {
    setupCompliantMocks();
    mockedFfprobe.mockResolvedValue({
      streams: [{ codec_type: 'audio', bit_rate: '256000' }],
      format: { bit_rate: '192000' }, // >5% variation from stream bitrate => VBR
    });
    const result = await analyzeAcxCompliance('/tmp/vbr.mp3');
    expect(result.format.cbr).toBe(false);
    expect(result.format.ok).toBe(false);
  });
});
