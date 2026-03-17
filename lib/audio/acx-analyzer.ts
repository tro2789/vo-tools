/**
 * ACX Audio Compliance Analyzer
 *
 * Analyzes audio files for compliance with ACX audiobook standards:
 * - MP3 format at 192 kbps or higher, Constant Bit Rate (CBR)
 * - 44.1 kHz sample rate
 * - Integrated loudness (LUFS) between -23 dB and -18 dB
 * - Peak amplitude no higher than -3 dB
 *
 * Port of acx_analyzer.py — uses FFmpeg CLI tools exclusively
 * (no numpy/scipy/pydub needed).
 */

import { getAudioMetadata, ffprobe, measureLoudness, measurePeak, detectSilence } from './ffmpeg';
import type { ACXResult } from '@/lib/types/acx';

export type { ACXResult };

const ACX_SPECS = {
  sampleRate: 44100,
  bitrateMin: 192000, // 192 kbps
  rmsMin: -23.0,      // dB (integrated loudness / LUFS)
  rmsMax: -18.0,      // dB (integrated loudness / LUFS)
  peakMax: -3.0,      // dB
} as const;

/**
 * Determine if an MP3 file uses Constant Bit Rate (CBR) encoding.
 * Compares stream bitrate vs format bitrate — less than 5% variation means CBR.
 */
async function isCbr(filepath: string): Promise<boolean> {
  try {
    const data = await ffprobe(filepath);
    const audio = data.streams.find((s) => s.codec_type === 'audio');
    if (!audio) return false;

    const streamBr = audio.bit_rate ? parseInt(audio.bit_rate, 10) : 0;
    const formatBr = data.format.bit_rate ? parseInt(data.format.bit_rate, 10) : 0;

    if (streamBr > 0 && formatBr > 0) {
      const variation = Math.abs(streamBr - formatBr) / streamBr;
      return variation < 0.05;
    }

    return streamBr > 0; // Has stream bitrate = likely CBR
  } catch {
    return true; // Assume CBR if unable to determine
  }
}

/**
 * Analyze an audio file for ACX audiobook compliance.
 *
 * Returns the same JSON shape that the frontend (ACXCheckContainer) expects:
 * format, sampleRate, rms, peak, silence, duration, channels, overallPass, summary.
 */
export async function analyzeAcxCompliance(filepath: string): Promise<ACXResult> {
  // Get metadata
  const metadata = await getAudioMetadata(filepath);

  // Format checks
  const isMp3 = metadata.format.toLowerCase().includes('mp3') || metadata.codec === 'mp3';
  const bitrate = metadata.bitRate;
  const bitrateOk = bitrate >= ACX_SPECS.bitrateMin;
  const cbr = isMp3 ? await isCbr(filepath) : true;

  // Sample rate
  const sampleRate = metadata.sampleRate;
  const sampleRateOk = sampleRate === ACX_SPECS.sampleRate;

  // Channels
  const channels = metadata.channels;
  const channelStr = channels === 1 ? 'mono' : channels === 2 ? 'stereo' : `${channels} channels`;

  // Integrated loudness (LUFS) via FFmpeg ebur128 filter
  const rmsDb = await measureLoudness(filepath);

  // Peak amplitude via FFmpeg astats filter
  const peakDb = await measurePeak(filepath);

  // Silence detection via FFmpeg silencedetect filter
  const [leadSilence, trailSilence] = await detectSilence(filepath);

  // Compliance checks
  const rmsOk = rmsDb >= ACX_SPECS.rmsMin && rmsDb <= ACX_SPECS.rmsMax;
  const peakOk = peakDb <= ACX_SPECS.peakMax;
  const formatOk = isMp3 && bitrateOk && cbr;
  const overallPass = formatOk && sampleRateOk && rmsOk && peakOk;

  return {
    format: {
      value: metadata.format,
      codec: metadata.codec,
      bitrate,
      bitrate_kbps: Math.round((bitrate / 1000) * 10) / 10,
      cbr,
      ok: formatOk,
      is_mp3: isMp3,
      message: isMp3
        ? `MP3 @ ${Math.round(bitrate / 1000)}kbps ${cbr ? 'CBR' : 'VBR'}`
        : metadata.format,
    },
    sampleRate: {
      value: sampleRate,
      ok: sampleRateOk,
      required: ACX_SPECS.sampleRate,
      message: `${sampleRate} Hz` + (sampleRateOk ? '' : ` (required: ${ACX_SPECS.sampleRate} Hz)`),
    },
    rms: {
      value: Math.round(rmsDb * 100) / 100,
      ok: rmsOk,
      range: [ACX_SPECS.rmsMin, ACX_SPECS.rmsMax],
      message:
        `${Math.round(rmsDb * 100) / 100} dB` +
        (rmsOk ? '' : ` (must be between ${ACX_SPECS.rmsMin} and ${ACX_SPECS.rmsMax} dB)`),
    },
    peak: {
      value: Math.round(peakDb * 100) / 100,
      ok: peakOk,
      max: ACX_SPECS.peakMax,
      message:
        `${Math.round(peakDb * 100) / 100} dB` +
        (peakOk ? '' : ` (must be <= ${ACX_SPECS.peakMax} dB)`),
    },
    silence: {
      lead: leadSilence,
      trail: trailSilence,
      message: `${leadSilence}s lead, ${trailSilence}s trail`,
    },
    duration: Math.round(metadata.duration * 100) / 100,
    channels: channelStr,
    overallPass,
    summary: overallPass ? 'ACX Compliant' : 'Not ACX Compliant',
  };
}
