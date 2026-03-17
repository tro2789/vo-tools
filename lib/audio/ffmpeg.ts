import { execFile as execFileCb } from 'child_process';
import { promisify } from 'util';

const execFile = promisify(execFileCb);

const FFMPEG_TIMEOUT = parseInt(process.env.FFMPEG_TIMEOUT || '300000', 10); // ms
const FFPROBE_TIMEOUT = 30_000; // 30s

export interface AudioMetadata {
  codec: string;
  sampleRate: number;
  channels: number;
  channelLayout: string;
  bitRate: number;
  duration: number;
  format: string;
}

export interface FfprobeData {
  streams: Array<{
    codec_type: string;
    codec_name?: string;
    sample_rate?: string;
    channels?: number;
    channel_layout?: string;
    bit_rate?: string;
  }>;
  format: {
    format_name?: string;
    duration?: string;
    bit_rate?: string;
  };
}

/**
 * Run ffprobe and return parsed JSON output.
 */
export async function ffprobe(filepath: string): Promise<FfprobeData> {
  const { stdout } = await execFile(
    'ffprobe',
    ['-v', 'quiet', '-print_format', 'json', '-show_format', '-show_streams', filepath],
    { timeout: FFPROBE_TIMEOUT }
  );
  return JSON.parse(stdout);
}

/**
 * Check if a file contains a valid audio stream.
 */
export async function isValidAudio(filepath: string): Promise<boolean> {
  try {
    const data = await ffprobe(filepath);
    return data.streams.some((s) => s.codec_type === 'audio');
  } catch {
    return false;
  }
}

/**
 * Extract audio metadata from a file.
 */
export async function getAudioMetadata(filepath: string): Promise<AudioMetadata> {
  const data = await ffprobe(filepath);
  const audio = data.streams.find((s) => s.codec_type === 'audio');
  if (!audio) throw new Error('No audio stream found in file');

  const fmt = data.format;
  return {
    codec: audio.codec_name || 'unknown',
    sampleRate: parseInt(audio.sample_rate || '0', 10),
    channels: audio.channels || 0,
    channelLayout: audio.channel_layout || 'unknown',
    bitRate: parseInt(audio.bit_rate || fmt.bit_rate || '0', 10),
    duration: parseFloat(fmt.duration || '0'),
    format: fmt.format_name || 'unknown',
  };
}

/**
 * Run an FFmpeg conversion command.
 */
export async function ffmpegConvert(args: string[]): Promise<{ stdout: string; stderr: string }> {
  return execFile('ffmpeg', args, { timeout: FFMPEG_TIMEOUT });
}

/**
 * Calculate integrated loudness (LUFS) using FFmpeg's ebur128 filter.
 * This is the ITU-R BS.1770 standard used by ACX Audio Lab.
 */
export async function measureLoudness(filepath: string): Promise<number> {
  const { stderr } = await execFile(
    'ffmpeg',
    ['-i', filepath, '-af', 'ebur128=framelog=verbose', '-f', 'null', '-'],
    { timeout: 120_000 }
  );

  // Parse "I:         -20.1 LUFS" from stderr
  for (const line of stderr.split('\n')) {
    if (line.includes('I:') && line.includes('LUFS')) {
      const match = line.split('I:')[1]?.split('LUFS')[0]?.trim();
      if (match) {
        const lufs = parseFloat(match);
        if (!isNaN(lufs)) return lufs;
      }
    }
  }
  throw new Error('Could not extract integrated loudness from FFmpeg output');
}

/**
 * Measure peak amplitude using FFmpeg's astats filter.
 * Returns peak in dBFS.
 */
export async function measurePeak(filepath: string): Promise<number> {
  const { stderr } = await execFile(
    'ffmpeg',
    ['-i', filepath, '-af', 'astats=metadata=1:reset=0', '-f', 'null', '-'],
    { timeout: 60_000 }
  );

  // Parse "Overall Peak dB" or "Peak level dB" from astats output
  for (const line of stderr.split('\n')) {
    if (line.includes('Peak level dB:')) {
      const match = line.split('Peak level dB:')[1]?.trim();
      if (match) {
        const peak = parseFloat(match);
        if (!isNaN(peak)) return peak;
      }
    }
  }
  throw new Error('Could not extract peak level from FFmpeg output');
}

/**
 * Detect silence at the beginning and end of an audio file.
 * Uses FFmpeg's silencedetect filter.
 * Returns [leadingSilenceSeconds, trailingSilenceSeconds].
 */
export async function detectSilence(
  filepath: string,
  thresholdDb: number = -40
): Promise<[number, number]> {
  // Get duration first
  const metadata = await getAudioMetadata(filepath);
  const duration = metadata.duration;

  const { stderr } = await execFile(
    'ffmpeg',
    [
      '-i', filepath,
      '-af', `silencedetect=noise=${thresholdDb}dB:d=0.01`,
      '-f', 'null', '-',
    ],
    { timeout: 60_000 }
  );

  // Parse silence_start and silence_end from stderr
  const silenceRanges: Array<{ start: number; end: number }> = [];
  let currentStart: number | null = null;

  for (const line of stderr.split('\n')) {
    const startMatch = line.match(/silence_start:\s*([\d.]+)/);
    const endMatch = line.match(/silence_end:\s*([\d.]+)/);

    if (startMatch) {
      currentStart = parseFloat(startMatch[1]);
    }
    if (endMatch && currentStart !== null) {
      silenceRanges.push({ start: currentStart, end: parseFloat(endMatch[1]) });
      currentStart = null;
    }
  }

  // Handle case where silence extends to end of file (no silence_end emitted)
  if (currentStart !== null) {
    silenceRanges.push({ start: currentStart, end: duration });
  }

  // Leading silence: silence range starting at 0
  let leadingSilence = 0;
  if (silenceRanges.length > 0 && silenceRanges[0].start < 0.01) {
    leadingSilence = silenceRanges[0].end;
  }

  // Trailing silence: silence range ending at duration
  let trailingSilence = 0;
  if (silenceRanges.length > 0) {
    const last = silenceRanges[silenceRanges.length - 1];
    if (Math.abs(last.end - duration) < 0.1) {
      trailingSilence = last.end - last.start;
    }
  }

  return [
    Math.round(leadingSilence * 100) / 100,
    Math.round(trailingSilence * 100) / 100,
  ];
}

/**
 * Check if FFmpeg is available on the system.
 */
export async function checkFfmpegAvailable(): Promise<boolean> {
  try {
    await execFile('ffmpeg', ['-version'], { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}
