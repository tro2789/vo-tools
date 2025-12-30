import { useState, useCallback } from 'react'
import { convertAudioFiles, ConverterAPIError } from '@/lib/api/converter'
import type { Format, VolumeLevel, ConversionOptions } from '@/lib/types/converter'

export interface UseAudioConverterResult {
  // State
  files: FileList | null
  format: Format
  volume: VolumeLevel
  optimize: boolean
  isLoading: boolean
  error: string | null
  
  // Actions
  setFiles: (files: FileList | null) => void
  setFormat: (format: Format) => void
  setVolume: (volume: VolumeLevel) => void
  setOptimize: (optimize: boolean) => void
  handleConvert: () => Promise<void>
  reset: () => void
}

export function useAudioConverter(): UseAudioConverterResult {
  const [files, setFiles] = useState<FileList | null>(null)
  const [format, setFormat] = useState<Format>('pcm16')
  const [volume, setVolume] = useState<VolumeLevel>('medium')
  const [optimize, setOptimize] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConvert = useCallback(async () => {
    if (!files || files.length === 0) {
      setError('Please select at least one file')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const options: ConversionOptions = {
        format,
        volume,
        optimize
      }

      const blob = await convertAudioFiles(files, options)

      // Download the file
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      
      // Determine filename based on number of files
      const filename = files.length === 1 
        ? `${files[0].name.split('.')[0]}_converted.wav`
        : 'batch_converted.zip'
      
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      // Reset files after successful conversion
      setFiles(null)
      
    } catch (err) {
      if (err instanceof ConverterAPIError) {
        setError(err.message)
      } else {
        setError(err instanceof Error ? err.message : 'An error occurred during conversion')
      }
    } finally {
      setIsLoading(false)
    }
  }, [files, format, volume, optimize])

  const reset = useCallback(() => {
    setFiles(null)
    setFormat('pcm16')
    setVolume('medium')
    setOptimize(false)
    setError(null)
  }, [])

  return {
    files,
    format,
    volume,
    optimize,
    isLoading,
    error,
    setFiles,
    setFormat,
    setVolume,
    setOptimize,
    handleConvert,
    reset
  }
}
