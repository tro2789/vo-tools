'use client';

import React, { useState } from 'react';
import { CheckCircle2, Download, ExternalLink, Trash2, Upload, XCircle } from 'lucide-react';
import { ACXResult } from '@/lib/types/acx';
import { Button, DocumentBar, DropZone, IconButton, Pill, RailSection, StatusBar, Workspace } from '@/components/shell';

interface FileWithResult {
  file: File;
  analyzing: boolean;
  result: ACXResult | null;
  error: string | null;
}

interface FailingCheck {
  label: string;
  value: string;
  limit: string;
}

const RESOURCE_LINKS = [
  {
    href: 'https://www.acx.com/help/acx-audio-submission-requirements/201456300',
    label: 'Official ACX audio requirements',
  },
  {
    href: 'https://www.trevorohare.com/blog/understanding-the-acx-submission-requirements-for-audio',
    label: 'Understanding the ACX requirements',
  },
  {
    href: "https://help.acx.com/s/article/the-acx-producer-s-checklist?utm_source=chatgpt.com",
    label: "The ACX producer's checklist",
  },
  {
    href: 'https://www.acx.com/audiolab?utm_source=chatgpt.com',
    label: 'ACX Audio Lab',
  },
] as const;

const REQUIREMENT_ROWS = [
  { label: 'MP3, constant bit rate', value: '≥ 192 kbps' },
  { label: 'Sample rate', value: '44.1 kHz' },
  { label: 'Integrated loudness', value: '−23 to −18 dB' },
  { label: 'Peak amplitude', value: '≤ −3 dB' },
] as const;

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const paddedSecs = String(secs).padStart(2, '0');

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${paddedSecs}`;
  }
  return `${minutes}:${paddedSecs}`;
}

function formatRuntime(seconds: number): string {
  if (seconds <= 0) return '0:00';
  return formatDuration(seconds);
}

function getFailingChecks(result: ACXResult): FailingCheck[] {
  const checks: FailingCheck[] = [];
  if (!result.format.ok) {
    checks.push({
      label: 'FORMAT',
      value: `${result.format.bitrate_kbps}k ${result.format.cbr ? 'CBR' : 'VBR'}`,
      limit: '≥ 192k CBR',
    });
  }
  if (!result.sampleRate.ok) {
    checks.push({
      label: 'RATE',
      value: `${(result.sampleRate.value / 1000).toFixed(1)}k`,
      limit: `${(result.sampleRate.required / 1000).toFixed(1)}k`,
    });
  }
  if (!result.rms.ok) {
    checks.push({
      label: 'RMS',
      value: `${result.rms.value} dB`,
      limit: `${result.rms.range[0]} TO ${result.rms.range[1]}`,
    });
  }
  if (!result.peak.ok) {
    checks.push({
      label: 'PEAK',
      value: `${result.peak.value} dB`,
      limit: `≤ ${result.peak.max}`,
    });
  }
  return checks;
}

export const ACXCheckContainer: React.FC = () => {
  const [files, setFiles] = useState<FileWithResult[]>([]);

  const addFiles = (newFiles: File[]) => {
    const audioFiles = newFiles.filter((file) => file.type.startsWith('audio/'));
    const fileObjects: FileWithResult[] = audioFiles.map((file) => ({
      file,
      analyzing: false,
      result: null,
      error: null,
    }));
    setFiles((prev) => [...prev, ...fileObjects]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const analyzeFile = async (index: number) => {
    const fileObj = files[index];
    if (!fileObj || fileObj.analyzing) return;

    setFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, analyzing: true, error: null, result: null } : f))
    );

    try {
      const formData = new FormData();
      formData.append('file', fileObj.file);

      const response = await fetch('/api/acx-check', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      setFiles((prev) => prev.map((f, i) => (i === index ? { ...f, analyzing: false, result: data } : f)));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during analysis';
      setFiles((prev) =>
        prev.map((f, i) => (i === index ? { ...f, analyzing: false, error: errorMessage } : f))
      );
    }
  };

  const analyzeAll = async () => {
    for (let i = 0; i < files.length; i++) {
      if (!files[i].result && !files[i].analyzing) {
        await analyzeFile(i);
      }
    }
  };

  const exportToCSV = () => {
    const analyzedFiles = files.filter((f) => f.result);
    if (analyzedFiles.length === 0) return;

    const headers = [
      'Filename',
      'Overall Pass',
      'Format',
      'Bitrate (kbps)',
      'CBR',
      'Sample Rate (Hz)',
      'RMS (dB)',
      'Peak (dB)',
      'Duration (s)',
      'Channels',
      'Lead Silence (s)',
      'Trail Silence (s)',
    ];

    const rows = analyzedFiles.map((f) => {
      const r = f.result!;
      return [
        f.file.name,
        r.overallPass ? 'PASS' : 'FAIL',
        r.format.codec,
        r.format.bitrate_kbps,
        r.format.cbr ? 'Yes' : 'No',
        r.sampleRate.value,
        r.rms.value,
        r.peak.value,
        r.duration,
        r.channels,
        r.silence.lead,
        r.silence.trail,
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `acx-compliance-report-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hasAnalyzable = files.some((f) => !f.result && !f.analyzing);
  const isAnalyzing = files.some((f) => f.analyzing);
  const hasResults = files.some((f) => f.result);

  const analyzedCount = files.filter((f) => f.result).length;
  const passCount = files.filter((f) => f.result?.overallPass).length;
  const failCount = files.filter((f) => f.result && !f.result.overallPass).length;
  const pendingCount = files.filter((f) => !f.result && !f.analyzing).length;

  const totalRuntime = files.reduce((sum, f) => sum + (f.result?.duration ?? 0), 0);

  const metaText = [
    `${analyzedCount} ANALYZED`,
    analyzedCount > 0 ? `${passCount} PASS` : null,
    analyzedCount > 0 ? `${failCount} FAIL` : null,
    pendingCount > 0 ? `${pendingCount} PENDING` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const failingFiles = files.filter((f) => f.result && !f.result.overallPass);

  return (
    <>
      <DocumentBar
        icon={CheckCircle2}
        title={<span className="text-[15px] font-semibold text-ink">Compliance batch</span>}
        meta={<span className="text-[11px] text-muted uppercase">{metaText}</span>}
        actions={
          <>
            <Button variant="secondary" size={26} icon={Download} onClick={exportToCSV} disabled={!hasResults}>
              Export CSV
            </Button>
            <Button
              variant="primary"
              size={26}
              onClick={analyzeAll}
              disabled={!hasAnalyzable || isAnalyzing}
            >
              {isAnalyzing ? 'Analyzing…' : 'Analyze all'}
            </Button>
          </>
        }
      />

      <Workspace
        mainClassName="p-4 lg:min-h-[560px]"
        main={
          files.length === 0 ? (
            <>
              <DropZone
                icon={Upload}
                title="Drop audiobook files here"
                hint="a chapter at a time, or the whole book"
                formats="MP3 · WAV · FLAC"
                height={180}
                iconSize={22}
                accept="audio/*"
                onFiles={addFiles}
              />
              <div className="mt-4 border border-line">
                <div className="border-b border-line px-3.5 py-[10px] text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">
                  What gets measured
                </div>
                {REQUIREMENT_ROWS.map((row) => (
                  <div
                    key={row.label}
                    className="flex h-7 items-center justify-between border-b border-line-faint px-3.5 last:border-b-0"
                  >
                    <span className="text-[12px] text-body">{row.label}</span>
                    <span className="text-[11px] text-ink">{row.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <DropZone
                icon={Upload}
                title="Drop audiobook files, or click to browse"
                formats="MP3 · WAV · FLAC"
                height={64}
                accept="audio/*"
                onFiles={addFiles}
              />

              <div className="mt-4 overflow-x-auto">
                <div className="min-w-[760px] border border-line">
                  <div className="grid h-[30px] grid-cols-[1fr_76px_90px_90px_86px_86px_96px_32px] items-center gap-2 border-b border-line bg-subtle px-3 text-[10px] font-semibold tracking-[0.1em] text-muted uppercase">
                    <span>File</span>
                    <span>Status</span>
                    <span className="text-right">Bitrate</span>
                    <span className="text-right">Rate</span>
                    <span className="text-right">RMS</span>
                    <span className="text-right">Peak</span>
                    <span className="text-right">Duration</span>
                    <span />
                  </div>
                  {files.map((fileObj, index) => {
                    const { file, result, analyzing, error } = fileObj;
                    const sizeMb = (file.size / 1024 / 1024).toFixed(2);
                    return (
                      <div
                        key={index}
                        className="grid grid-cols-[1fr_76px_90px_90px_86px_86px_96px_32px] items-center gap-2 border-b border-line px-3 py-[10px] last:border-b-0"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-[13px] text-ink">{file.name}</div>
                          <div className="text-[10px] text-muted">
                            {sizeMb} MB{result ? ` · ${result.channels.toUpperCase()} · ${result.format.cbr ? 'CBR' : 'VBR'}` : ''}
                          </div>
                        </div>

                        {result ? (
                          <Pill tone={result.overallPass ? 'ok' : 'bad'} className="justify-self-start">
                            {result.overallPass ? 'PASS' : 'FAIL'}
                          </Pill>
                        ) : (
                          <span className="text-[11px] text-muted">
                            {analyzing ? 'ANALYZING…' : error ? 'ERROR' : 'PENDING'}
                          </span>
                        )}

                        <span className="text-right text-[12px] text-body">
                          {result ? `${result.format.bitrate_kbps}k` : '—'}
                        </span>
                        <span className="text-right text-[12px] text-body">
                          {result ? `${(result.sampleRate.value / 1000).toFixed(1)}k` : '—'}
                        </span>
                        <span
                          className={`text-right text-[12px] ${
                            result && !result.rms.ok ? 'font-semibold text-bad' : 'text-body'
                          }`}
                        >
                          {result ? result.rms.value : '—'}
                        </span>
                        <span
                          className={`text-right text-[12px] ${
                            result && !result.peak.ok ? 'font-semibold text-bad' : 'text-body'
                          }`}
                        >
                          {result ? result.peak.value : '—'}
                        </span>
                        <div className="text-right">
                          <div className="text-[12px] text-body">{result ? formatDuration(result.duration) : '—'}</div>
                          {result ? (
                            <div className="text-[10px] text-muted">
                              {result.silence.lead.toFixed(1)} / {result.silence.trail.toFixed(1)}s
                            </div>
                          ) : null}
                        </div>

                        <IconButton
                          icon={Trash2}
                          label={`Remove ${file.name}`}
                          onClick={() => removeFile(index)}
                          disabled={analyzing}
                          className="justify-self-end"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {failingFiles.map((fileObj, index) => {
                const checks = getFailingChecks(fileObj.result!);
                if (checks.length === 0) return null;
                return (
                  <div
                    key={`fail-${index}`}
                    className="mt-3 flex items-start gap-2 border border-line bg-subtle px-3 py-[10px]"
                  >
                    <XCircle width={14} height={14} className="mt-[2px] shrink-0 text-bad" aria-hidden="true" />
                    <div>
                      <div className="text-[12px] font-medium text-ink">
                        {fileObj.file.name} — {checks.length} measurement{checks.length !== 1 ? 's' : ''} out of range
                      </div>
                      <div className="mt-[2px] text-[11px] text-muted uppercase">
                        {checks.map((c) => `${c.label} ${c.value} (LIMIT ${c.limit})`).join(' · ')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )
        }
        rail={
          <>
            <RailSection label="ACX requirements">
              <div className="flex flex-col">
                {REQUIREMENT_ROWS.map((row) => (
                  <div
                    key={row.label}
                    className="flex h-[30px] items-center justify-between border-b border-line-faint"
                  >
                    <span className="text-[12px] text-body">{row.label}</span>
                    <span className="text-[11px] text-ink">{row.value}</span>
                  </div>
                ))}
                <div className="flex h-[30px] items-center justify-between">
                  <span className="text-[12px] text-body">Lead / trail silence</span>
                  <span className="text-[11px] text-muted">measured, not scored</span>
                </div>
              </div>
            </RailSection>

            <RailSection label="Resources">
              <div className="flex flex-col gap-2">
                {RESOURCE_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[12px] text-ink"
                  >
                    <ExternalLink width={13} height={13} aria-hidden="true" />
                    {link.label}
                  </a>
                ))}
              </div>
            </RailSection>

            <RailSection label="Analysis only" last>
              <p className="m-0 text-[12px] leading-[1.55] text-body">
                Files are measured, never modified. A failing file has to be re-mastered in your editor, then
                checked again.
              </p>
            </RailSection>
          </>
        }
      />

      <StatusBar
        left={[
          <span key="analyzed">{analyzedCount} ANALYZED</span>,
          <span key="pass">{passCount} PASS</span>,
          <span key="fail">{failCount} FAIL</span>,
        ]}
        right={[
          <span key="runtime">{formatRuntime(totalRuntime)} TOTAL RUNTIME</span>,
          <span key="state">{files.length === 0 ? 'NO FILES' : isAnalyzing ? 'ANALYZING' : 'REPORT READY'}</span>,
        ]}
      />
    </>
  );
};
