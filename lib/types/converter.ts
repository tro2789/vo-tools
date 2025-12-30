// API Response Types

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy'
  service: string
  version: string
  error?: string
}

export interface ErrorResponse {
  error: string
  retry_after?: string
}

// Conversion Types
export type Format = 'ulaw' | 'alaw' | 'pcm8' | 'pcm16' | 'pcm16hd' | 'g722' | 'sln'
export type VolumeLevel = 'quiet' | 'lower' | 'medium' | 'high' | 'max'

export interface ConversionOptions {
  format: Format
  volume: VolumeLevel
  optimize: boolean
}

export interface FormatOption {
  value: Format
  label: string
  description: string
}

export interface VolumeOption {
  value: VolumeLevel
  label: string
}

// Constants
export const FORMATS: FormatOption[] = [
  { 
    value: 'ulaw', 
    label: 'µ-law WAV',
    description: '8Khz, Mono, CCITT µ-law'
  },
  { 
    value: 'alaw', 
    label: 'A-law WAV',
    description: '8Khz, Mono, CCITT A-law'
  },
  { 
    value: 'pcm8', 
    label: 'Low Definition 8-bit WAV',
    description: '8Khz, Mono, 8-Bit PCM'
  },
  { 
    value: 'pcm16', 
    label: 'Standard Definition 16-bit WAV',
    description: '8Khz, Mono, 16-Bit PCM'
  },
  { 
    value: 'pcm16hd', 
    label: 'High Definition WAV',
    description: '16Khz, Mono, 16-Bit PCM'
  },
  { 
    value: 'g722', 
    label: 'Asterisk G.722',
    description: '16Khz, Mono, G.722'
  },
  { 
    value: 'sln', 
    label: 'Asterisk RAW',
    description: '8Khz, Mono, RAW'
  },
]

export const VOLUME_LEVELS: VolumeOption[] = [
  { value: 'quiet', label: 'Quiet' },
  { value: 'lower', label: 'Lower' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'max', label: 'Maximum' },
]

export const ALLOWED_FILE_TYPES = [
  '.wav',
  '.mp3',
  '.ogg',
  '.flac',
  '.m4a',
  '.aiff',
  '.wma',
  '.aac'
] as const

export const MAX_FILE_SIZE_MB = 50
