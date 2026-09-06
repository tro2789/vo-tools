"use client"

import { useState } from 'react'
import type { ChangeEvent } from 'react'
import {
  AudioWaveform,
  Upload,
  RotateCcw,
  Trash2,
  Info,
  XCircle,
  Download,
} from 'lucide-react'
import {
  DocumentBar,
  Workspace,
  StatusBar,
  RailSection,
  Button,
  IconButton,
  DropZone,
} from '@/components/shell'
import { convertAudioFiles, ConverterAPIError } from '@/lib/api/converter'
import { FORMATS, VOLUME_LEVELS, ALLOWED_FILE_TYPES } from '@/lib/types/converter'
import type { Format, VolumeLevel } from '@/lib/types/converter'

const FORMAT_META: Record<Format, { code: string; statusRate: string; infoRate: string; railSpec: string }> = {
  ulaw: { code: 'ULAW', statusRate: '8K MONO', infoRate: '8KHZ MONO', railSpec: '8K MONO' },
  alaw: { code: 'ALAW', statusRate: '8K MONO', infoRate: '8KHZ MONO', railSpec: '8K MONO' },
  pcm8: { code: 'PCM8', statusRate: '8K MONO', infoRate: '8KHZ MONO', railSpec: '8-BIT PCM' },
  pcm16: { code: 'PCM16', statusRate: '8K MONO', infoRate: '8KHZ MONO', railSpec: '16-BIT PCM' },
  pcm16hd: { code: 'PCM16 HD', statusRate: '16K MONO', infoRate: '16KHZ MONO', railSpec: '16K MONO' },
  g722: { code: 'G.722', statusRate: '16K MONO', infoRate: '16KHZ MONO', railSpec: '16K G.722' },
  sln: { code: 'SLN', statusRate: '8K MONO', infoRate: '8KHZ MONO', railSpec: '8K SLN' },
}

const FORMATS_LINE = 'WAV · MP3 · OGG · FLAC · M4A · AIFF · WMA · AAC'

function formatRowSize(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(3)} MB`
}

function formatTotalSize(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function dedupeAdd(existing: File[], added: File[]): File[] {
  const keyOf = (f: File) => `${f.name}::${f.size}`
  const seen = new Set(existing.map(keyOf))
  const next = [...existing]
  for (const file of added) {
    const key = keyOf(file)
    if (!seen.has(key)) {
      seen.add(key)
      next.push(file)
    }
  }
  return next
}

function filesToFileList(files: File[]): FileList {
  const dt = new DataTransfer()
  files.forEach((file) => dt.items.add(file))
  return dt.files
}

export default function TelephonyConverterPage() {
  const [files, setFiles] = useState<File[]>([])
  const [format, setFormat] = useState<Format>('pcm16')
  const [volume, setVolume] = useState<VolumeLevel>('medium')
  const [optimize, setOptimize] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totalBytes = files.reduce((sum, f) => sum + f.size, 0)
  const selectedFormat = FORMATS.find((f) => f.value === format) ?? FORMATS[0]
  const selectedVolume = VOLUME_LEVELS.find((v) => v.value === volume) ?? VOLUME_LEVELS[2]
  const meta = FORMAT_META[format]

  const addFiles = (added: File[]) => {
    setError(null)
    setFiles((prev) => dedupeAdd(prev, added))
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const clearQueue = () => {
    setFiles([])
    setError(null)
  }

  const handleSubmit = async () => {
    if (files.length === 0) {
      setError('Please select at least one file')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const blob = await convertAudioFiles(filesToFileList(files), {
        format,
        volume,
        optimize,
      })

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url

      const filename =
        files.length === 1
          ? `${files[0].name.split('.')[0]}_converted.wav`
          : 'batch_converted.zip'

      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setFiles([])
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

  const hasFiles = files.length > 0

  return (
    <div className="flex min-h-screen w-full flex-col bg-page">
      <DocumentBar
        icon={AudioWaveform}
        title={<span className="text-[15px] font-semibold text-ink">Conversion queue</span>}
        meta={
          <span className="text-[11px] text-muted uppercase">
            {hasFiles
              ? `${files.length} FILE${files.length > 1 ? 'S' : ''} · ${formatTotalSize(totalBytes)} · MAX 50 MB`
              : '0 FILES · MAX 50 MB'}
          </span>
        }
        actions={
          hasFiles ? (
            <Button variant="secondary" tone="muted" size={26} icon={RotateCcw} onClick={clearQueue}>
              Clear queue
            </Button>
          ) : null
        }
      />

      <Workspace
        className="flex-1"
        mainClassName="p-4 lg:min-h-[560px]"
        main={
          <div>
            <DropZone
              icon={Upload}
              title={hasFiles ? 'Drop audio files, or click to browse' : 'Drop audio files here'}
              hint={hasFiles ? undefined : 'or click to browse — several at once is fine'}
              formats={FORMATS_LINE}
              height={hasFiles ? 96 : 180}
              accept={ALLOWED_FILE_TYPES.join(',')}
              multiple
              onFiles={addFiles}
            />

            {hasFiles ? (
              <div className="mt-4 overflow-x-auto border border-line">
                <div className="grid h-[30px] min-w-[300px] grid-cols-[1fr_110px_40px] items-center gap-3 border-b border-line bg-subtle px-3 text-[10px] font-semibold tracking-[0.12em] text-muted uppercase">
                  <span>FILE</span>
                  <span className="text-right">SIZE</span>
                  <span />
                </div>
                {files.map((file, index) => (
                  <div
                    key={`${file.name}::${file.size}::${index}`}
                    className={`grid h-[38px] min-w-[300px] grid-cols-[1fr_110px_40px] items-center gap-3 px-3 ${
                      index < files.length - 1 ? 'border-b border-line' : ''
                    }`}
                  >
                    <span className="truncate text-[13px] text-ink">{file.name}</span>
                    <span className="text-right text-[12px] text-body">{formatRowSize(file.size)}</span>
                    <IconButton
                      icon={Trash2}
                      label={`Remove ${file.name}`}
                      className="justify-self-end"
                      onClick={() => removeFile(index)}
                    />
                  </div>
                ))}
              </div>
            ) : null}

            {error ? (
              <div className="mt-4 flex items-center gap-[10px] border border-line bg-subtle px-[14px] py-3">
                <XCircle width={14} height={14} className="shrink-0 text-bad" aria-hidden="true" />
                <span className="text-[12px] text-bad">{error}</span>
              </div>
            ) : hasFiles ? (
              <div className="mt-4 flex items-center gap-[10px] border border-line bg-subtle px-[14px] py-3">
                <Info width={14} height={14} className="shrink-0 text-muted" aria-hidden="true" />
                <span className="text-[12px] text-body">
                  Output:{' '}
                  <span className="text-[11px]">
                    {selectedFormat.label.toUpperCase()} · {meta.infoRate} · {selectedVolume.label.toUpperCase()}
                  </span>
                  . A single file downloads as WAV; several download as a ZIP.
                </span>
              </div>
            ) : (
              <div className="mt-4 border border-line bg-subtle px-[14px] py-3">
                <div className="mb-[6px] text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">
                  DEFAULTS
                </div>
                <div className="text-[12px] leading-[1.6] text-body">
                  Standard definition 16-bit WAV, 8 kHz mono, medium volume, no phone filter. Change any of it
                  in the rail before converting.
                </div>
              </div>
            )}
          </div>
        }
        rail={
          <>
            <RailSection label="OUTPUT FORMAT">
              <div className="flex flex-col">
                {FORMATS.map((option, index) => {
                  const selected = option.value === format
                  return (
                    <label
                      key={option.value}
                      className={`flex h-[30px] cursor-pointer items-center gap-2 ${
                        index < FORMATS.length - 1 ? 'border-b border-line-faint' : ''
                      } ${selected ? 'bg-page' : ''}`}
                    >
                      <input
                        type="radio"
                        name="format"
                        value={option.value}
                        checked={selected}
                        onChange={() => setFormat(option.value)}
                        className="h-[13px] w-[13px] m-0"
                      />
                      <span
                        className={`flex-1 text-[12px] ${
                          selected ? 'font-medium text-ink' : 'text-body'
                        }`}
                      >
                        {option.label}
                      </span>
                      <span
                        className={`text-[10px] uppercase ${selected ? 'text-body' : 'text-muted'}`}
                      >
                        {FORMAT_META[option.value].railSpec}
                      </span>
                    </label>
                  )
                })}
              </div>
            </RailSection>

            <RailSection label="VOLUME">
              <div className="flex h-[28px] border border-line-strong">
                {VOLUME_LEVELS.map((option, index) => {
                  const selected = option.value === volume
                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setVolume(option.value)}
                      className={`flex-1 text-[11px] transition-colors ${
                        index > 0 ? 'border-l border-line-strong' : ''
                      } ${selected ? 'bg-button font-medium text-panel' : 'bg-panel text-muted'}`}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>
            </RailSection>

            <RailSection label="OPTIONS">
              <label className="flex cursor-pointer items-start gap-2">
                <input
                  type="checkbox"
                  checked={optimize}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setOptimize(e.target.checked)}
                  className="mt-[2px] h-[13px] w-[13px]"
                />
                <span>
                  <span className="block text-[12px] font-medium text-body">Optimize for phone</span>
                  <span className="block text-[10px] text-muted uppercase">BANDPASS 300&ndash;3400 HZ</span>
                </span>
              </label>
            </RailSection>

            <RailSection last pad={16} className="mt-auto">
              <Button
                variant="primary"
                size={40}
                icon={Download}
                disabled={!hasFiles || isLoading}
                onClick={handleSubmit}
                className="w-full"
              >
                {isLoading
                  ? 'Converting…'
                  : `Convert ${files.length || 1} file${(files.length || 1) === 1 ? '' : 's'}`}
              </Button>
            </RailSection>
          </>
        }
      />

      <StatusBar
        left={[
          `${files.length} FILE${files.length === 1 ? '' : 'S'}`,
          formatTotalSize(totalBytes),
          `${meta.code} · ${meta.statusRate}`,
          selectedVolume.label.toUpperCase(),
        ]}
        right={[`BANDPASS ${optimize ? 'ON' : 'OFF'}`, error ? 'ERROR' : isLoading ? 'CONVERTING' : hasFiles ? 'READY' : 'EMPTY']}
      />
    </div>
  )
}
