/**
 * ACX Audio Compliance Types
 */

export interface ACXResult {
  format: {
    value: string;
    codec: string;
    bitrate: number;
    bitrate_kbps: number;
    cbr: boolean;
    ok: boolean;
    is_mp3: boolean;
    message: string;
  };
  sampleRate: {
    value: number;
    ok: boolean;
    required: number;
    message: string;
  };
  rms: {
    value: number;
    ok: boolean;
    range: [number, number];
    message: string;
  };
  peak: {
    value: number;
    ok: boolean;
    max: number;
    message: string;
  };
  silence: {
    lead: number;
    trail: number;
    message: string;
  };
  duration: number;
  channels: string;
  overallPass: boolean;
  summary: string;
}
