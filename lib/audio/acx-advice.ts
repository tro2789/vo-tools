/**
 * ACX fix-suggestion builder.
 *
 * Turns a failing ACXResult into concrete, actionable advice: what to change,
 * in real numbers, so the file can be re-mastered and re-checked.
 */

import type { ACXResult } from '@/lib/types/acx';

export type AcxAdviceCheck = 'format' | 'sampleRate' | 'rms' | 'peak';

export interface AcxAdvice {
  check: AcxAdviceCheck;
  title: string;
  detail: string;
}

/** Strips trailing zeros (and a trailing bare decimal point) after fixing to `decimals` places. */
function trimZeros(value: number, decimals: number): string {
  return value.toFixed(decimals).replace(/\.?0+$/, '');
}

/** Formats a value with the ACX minus sign (U+2212), trimming trailing zeros. Value is signed. */
function formatSigned(value: number, decimals: number): string {
  const trimmed = trimZeros(Math.abs(value), decimals);
  return value < 0 ? `−${trimmed}` : trimmed;
}

/** Formats a dB-style value always to one decimal place, with the ACX minus sign. */
function formatDb(value: number): string {
  const fixed = Math.abs(value).toFixed(1);
  return value < 0 ? `−${fixed}` : fixed;
}

function buildFormatAdvice(result: ACXResult): AcxAdvice | null {
  const { format } = result;
  if (format.ok) return null;

  if (!format.is_mp3) {
    return {
      check: 'format',
      title: 'Export as MP3',
      detail: 'ACX accepts MP3 only. Export from your editor as MP3, 192 kbps or higher, constant bit rate.',
    };
  }

  if (!format.cbr) {
    return {
      check: 'format',
      title: 'Use constant bit rate',
      detail:
        'MP3 can be exported as VBR (variable) or CBR (constant) bit rate. ACX requires CBR. Re-export using constant bit rate at 192 kbps or higher.',
    };
  }

  return {
    check: 'format',
    title: 'Raise the bit rate',
    detail: `Currently ${formatSigned(format.bitrate_kbps, 1)} kbps. Re-export at 192 kbps or higher, constant bit rate.`,
  };
}

function buildSampleRateAdvice(result: ACXResult): AcxAdvice | null {
  const { sampleRate } = result;
  if (sampleRate.ok) return null;

  return {
    check: 'sampleRate',
    title: 'Resample to 44.1 kHz',
    detail: `Currently ${formatSigned(sampleRate.value / 1000, 2)} kHz. Set the project or export sample rate to 44100 Hz before encoding.`,
  };
}

function buildRmsAdvice(result: ACXResult): AcxAdvice | null {
  const { rms, peak } = result;
  if (rms.ok) return null;

  const [min, max] = rms.range;
  const midpoint = (min + max) / 2;
  const window = `${formatSigned(min, 1)} to ${formatSigned(max, 1)}`;
  const low = rms.value < min;

  const detail = low
    ? `RMS is ${formatDb(rms.value)} dB. Raise gain by about ${formatDb(midpoint - rms.value)} dB to land near ${formatDb(midpoint)} dB (the middle of the ${window} window), then re-check peaks.`
    : `RMS is ${formatDb(rms.value)} dB. Lower gain by about ${formatDb(rms.value - midpoint)} dB to land near ${formatDb(midpoint)} dB (the middle of the ${window} window), then re-check peaks.`;

  const note =
    low && !peak.ok
      ? ' Raising gain will push peaks higher; use a limiter or compression rather than plain gain.'
      : '';

  return {
    check: 'rms',
    title: low ? 'Raise the overall level' : 'Lower the overall level',
    detail: detail + note,
  };
}

function buildPeakAdvice(result: ACXResult): AcxAdvice | null {
  const { peak } = result;
  if (peak.ok) return null;

  const margin = peak.max - 0.5;

  return {
    check: 'peak',
    title: 'Limit the peaks',
    detail: `Peak is ${formatDb(peak.value)} dB. Apply a limiter with a ceiling of ${formatDb(peak.max)} dB (${formatDb(margin)} dB leaves a margin). If you also raise gain for RMS, limit after the gain change.`,
  };
}

/** Builds concrete, numeric fix suggestions for a failing ACXResult. Empty when the file passes. */
export function buildAcxAdvice(result: ACXResult): AcxAdvice[] {
  if (result.overallPass) return [];

  return [
    buildFormatAdvice(result),
    buildSampleRateAdvice(result),
    buildRmsAdvice(result),
    buildPeakAdvice(result),
  ].filter((advice): advice is AcxAdvice => advice !== null);
}
