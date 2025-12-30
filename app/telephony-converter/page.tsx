"use client"

import { useState } from 'react'
import { Upload, Volume2, Settings, Download, RotateCcw } from 'lucide-react'
import { Footer } from '@/components/Footer'
import { convertAudioFiles, ConverterAPIError } from '@/lib/api/converter'
import { FORMATS, VOLUME_LEVELS, ALLOWED_FILE_TYPES } from '@/lib/types/converter'
import type { Format, VolumeLevel } from '@/lib/types/converter'

export default function TelephonyConverterPage() {
  const [files, setFiles] = useState<FileList | null>(null)
  const [format, setFormat] = useState<Format>('pcm16')
  const [volume, setVolume] = useState<VolumeLevel>('medium')
  const [optimize, setOptimize] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    setFiles(e.target.files)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!files || files.length === 0) {
      setError('Please select at least one file')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const blob = await convertAudioFiles(files, {
        format,
        volume,
        optimize
      })

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
      
      // Reset form
      setFiles(null)
      const fileInput = document.getElementById('file-input') as HTMLInputElement
      if (fileInput) fileInput.value = ''
      
    } catch (err) {
      if (err instanceof ConverterAPIError) {
        setError(err.message)
      } else {
        setError(err instanceof Error ? err.message : 'An error occurred during conversion')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setFiles(null)
    setFormat('pcm16')
    setVolume('medium')
    setOptimize(false)
    setError(null)
    const fileInput = document.getElementById('file-input') as HTMLInputElement
    if (fileInput) fileInput.value = ''
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      
      {/* Page Header - Secondary controls specific to Telephony Converter */}
      <div className="w-full border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 px-4 md:px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Telephony Converter
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Convert media files into telephony-compatible formats for IVR systems and VoIP applications
              </p>
            </div>
            
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-lg font-medium text-sm transition-all bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400"
              title="Reset all fields"
            >
              <RotateCcw size={16} />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>
      </div>

      <main className="w-full max-w-7xl mx-auto px-4 md:px-6 py-4">
        <div className="max-w-5xl mx-auto">

          {/* Error Banner */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg mb-4 text-sm">
              <strong>Error:</strong> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* File Upload */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800/60 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Upload className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  1. Source File
                </h3>
              </div>
              <input
                id="file-input"
                type="file"
                multiple
                required
                onChange={handleFileChange}
                accept={ALLOWED_FILE_TYPES.join(',')}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                Max total size: 50MB
              </p>
              {files && files.length > 0 && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1.5 font-medium">
                  ✓ {files.length} file{files.length > 1 ? 's' : ''} selected
                </p>
              )}
            </div>

            {/* Format Selection */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800/60 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Settings className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  2. Output Format
                </h3>
              </div>
              <div className="space-y-1.5">
                {FORMATS.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 p-2 rounded-lg transition-colors"
                  >
                    <input
                      type="radio"
                      name="format"
                      value={option.value}
                      checked={format === option.value}
                      onChange={(e) => setFormat(e.target.value as Format)}
                      className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-slate-700 dark:text-slate-300 text-xs">
                      {option.label} ({option.description})
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Volume Control and Options - Combined Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800/60 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Volume2 className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                    3. Volume
                  </h3>
                </div>
                <div className="flex flex-wrap gap-3">
                  {VOLUME_LEVELS.map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-1.5 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="volume"
                        value={option.value}
                        checked={volume === option.value}
                        onChange={(e) => setVolume(e.target.value as VolumeLevel)}
                        className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-slate-700 dark:text-slate-300 text-xs">
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800/60 p-4">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-3">
                  4. Options
                </h3>
                <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 p-2 rounded-lg transition-colors">
                  <input
                    type="checkbox"
                    checked={optimize}
                    onChange={(e) => setOptimize(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-slate-700 dark:text-slate-300 text-xs">
                    Optimize Audio for Phone (Bandpass Filter 300-3400Hz)
                  </span>
                </label>
              </div>
            </div>

            {/* Action Button */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isLoading || !files}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 text-white rounded-lg transition-all font-medium text-sm shadow-lg shadow-blue-500/20 disabled:cursor-not-allowed disabled:shadow-none"
              >
                <Download className="w-4 h-4" />
                {isLoading ? 'Converting...' : 'Convert & Download'}
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  )
}
