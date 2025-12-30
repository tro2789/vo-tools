import type { ConversionOptions, ErrorResponse, HealthCheckResponse } from '../types/converter'

// Get API URL from environment or use default
function getAPIUrl(): string {
  // In Next.js, NEXT_PUBLIC_ env vars are replaced at build time
  // Empty string means same origin (Flask serves both static files and API)
  return process.env.NEXT_PUBLIC_API_URL || ''
}

const API_URL = getAPIUrl()

export class ConverterAPIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public retryAfter?: string
  ) {
    super(message)
    this.name = 'ConverterAPIError'
  }
}

/**
 * Check API health status
 */
export async function checkHealth(): Promise<HealthCheckResponse> {
  try {
    const response = await fetch(`${API_URL}/health`)
    
    if (!response.ok) {
      throw new ConverterAPIError(
        'Health check failed',
        response.status
      )
    }
    
    return await response.json()
  } catch (error) {
    if (error instanceof ConverterAPIError) {
      throw error
    }
    throw new ConverterAPIError(
      'Unable to connect to conversion service',
      503
    )
  }
}

/**
 * Convert audio files
 */
export async function convertAudioFiles(
  files: FileList,
  options: ConversionOptions
): Promise<Blob> {
  const formData = new FormData()
  
  // Add all files
  Array.from(files).forEach(file => {
    formData.append('file', file)
  })
  
  // Add conversion options
  formData.append('format', options.format)
  formData.append('volume', options.volume)
  if (options.optimize) {
    formData.append('optimize', 'yes')
  }

  try {
    const response = await fetch(`${API_URL}/api/convert`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      // Try to parse error response
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        const errorData: ErrorResponse = await response.json()
        throw new ConverterAPIError(
          errorData.error,
          response.status,
          errorData.retry_after
        )
      }
      
      // Fallback for non-JSON errors
      const text = await response.text()
      throw new ConverterAPIError(
        text || 'Conversion failed',
        response.status
      )
    }

    return await response.blob()
  } catch (error) {
    if (error instanceof ConverterAPIError) {
      throw error
    }
    
    // Network or other errors
    throw new ConverterAPIError(
      error instanceof Error ? error.message : 'An unexpected error occurred',
      0
    )
  }
}

/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
}

/**
 * Get download filename from response headers or use default
 */
export function getDownloadFilename(
  response: Response,
  defaultName: string = 'converted_audio.wav'
): string {
  const contentDisposition = response.headers.get('Content-Disposition')
  if (!contentDisposition) {
    return defaultName
  }
  
  const filenameMatch = contentDisposition.match(/filename="?(.+)"?/)
  return filenameMatch ? filenameMatch[1] : defaultName
}
