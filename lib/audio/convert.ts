import { ffmpegConvert } from './ffmpeg';
import path from 'path';

// Format -> FFmpeg codec arguments (from app.py FORMATS)
export const FORMATS: Record<string, string[]> = {
  ulaw:    ['-ar', '8000', '-ac', '1', '-c:a', 'pcm_mulaw'],
  alaw:    ['-ar', '8000', '-ac', '1', '-c:a', 'pcm_alaw'],
  pcm16:   ['-ar', '8000', '-ac', '1', '-c:a', 'pcm_s16le'],
  g722:    ['-ar', '16000', '-ac', '1', '-c:a', 'g722'],
  pcm8:    ['-ar', '8000', '-ac', '1', '-c:a', 'pcm_u8'],
  pcm16hd: ['-ar', '16000', '-ac', '1', '-c:a', 'pcm_s16le'],
  sln:     ['-ar', '8000', '-ac', '1', '-c:a', 'pcm_s16le', '-f', 's16le'],
};

export const EXTENSIONS: Record<string, string> = {
  ulaw: '.wav', alaw: '.wav', pcm16: '.wav', pcm8: '.wav',
  pcm16hd: '.wav', g722: '.g722', sln: '.sln',
};

export const SUFFIXES: Record<string, string> = {
  ulaw: '_ulaw', alaw: '_alaw', pcm16: '_pcm16', g722: '_g722',
  pcm8: '_8bit', pcm16hd: '_hd', sln: '_raw',
};

const ALLOWED_EXTENSIONS = new Set(
  (process.env.ALLOWED_EXTENSIONS || 'wav,mp3,ogg,flac,m4a,aiff,wma,aac').split(',')
);

export type VolumeLevel = 'quiet' | 'lower' | 'medium' | 'high' | 'max';

export function isAllowedFile(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ext ? ALLOWED_EXTENSIONS.has(ext) : false;
}

export function isValidFormat(format: string): boolean {
  return format in FORMATS;
}

export function isValidVolume(volume: string): volume is VolumeLevel {
  return ['quiet', 'lower', 'medium', 'high', 'max'].includes(volume);
}

/**
 * Sanitize a filename - remove path separators and limit length.
 */
export function sanitizeFilename(filename: string): string {
  // Remove path separators and parent directory references
  let safe = path.basename(filename)
    .replace(/\.\./g, '')
    .replace(/[/\\]/g, '');

  if (safe.length > 255) {
    const ext = path.extname(safe);
    safe = safe.slice(0, 250) + ext;
  }
  return safe;
}

/**
 * Build the FFmpeg audio filter string based on volume and optimize settings.
 */
export function buildAudioFilters(volume: VolumeLevel, optimize: boolean): string[] {
  const filters: string[] = [];

  if (volume === 'quiet') filters.push('volume=-10dB');
  else if (volume === 'lower') filters.push('volume=-5dB');
  else if (volume === 'high') filters.push('volume=5dB');
  else if (volume === 'max') filters.push('loudnorm=I=-16:TP=-1.5:LRA=11');

  if (optimize) {
    filters.push('highpass=f=300,lowpass=f=3400');
  }

  return filters;
}

/**
 * Convert a single audio file using FFmpeg.
 */
export async function convertFile(
  inputPath: string,
  outputPath: string,
  targetFormat: string,
  filters: string[]
): Promise<void> {
  const filterArgs = filters.length > 0 ? ['-af', filters.join(',')] : [];
  const formatArgs = FORMATS[targetFormat] || FORMATS['ulaw'];

  await ffmpegConvert([
    '-y', '-i', inputPath,
    ...filterArgs,
    ...formatArgs,
    outputPath,
  ]);
}

/**
 * Input flags FFmpeg needs to read a converted file back.
 *
 * Only headerless targets need them: `sln` is raw 8 kHz mono s16le with no
 * container, so FFmpeg cannot infer the format from the file itself.
 */
export function previewInputArgs(targetFormat: string): string[] {
  return targetFormat === 'sln' ? ['-f', 's16le', '-ar', '8000', '-ac', '1'] : [];
}

/**
 * Render a browser-playable preview of what a conversion sounds like.
 *
 * Two passes: the normal conversion chain first, so the target codec's
 * artefacts end up in the audio, then a decode of that result back to a
 * 16-bit PCM WAV at the converted file's own sample rate. Returns the path
 * of the preview WAV, which lives inside `outputDir`.
 */
export async function renderPreview(
  inputPath: string,
  outputDir: string,
  targetFormat: string,
  filters: string[]
): Promise<string> {
  const ext = EXTENSIONS[targetFormat] || '.wav';
  const convertedPath = path.join(outputDir, `preview_source${ext}`);
  await convertFile(inputPath, convertedPath, targetFormat, filters);

  const previewPath = path.join(outputDir, 'preview.wav');
  await ffmpegConvert([
    '-y',
    ...previewInputArgs(targetFormat),
    '-i', convertedPath,
    '-c:a', 'pcm_s16le',
    '-f', 'wav',
    previewPath,
  ]);

  return previewPath;
}
