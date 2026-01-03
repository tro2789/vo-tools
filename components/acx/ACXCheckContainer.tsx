'use client';

import React, { useState } from 'react';
import { Upload, FileAudio, CheckCircle, XCircle, AlertCircle, ExternalLink, Trash2, Download } from 'lucide-react';
import { ACXResult } from '@/lib/types/acx';

interface FileWithResult {
  file: File;
  analyzing: boolean;
  result: ACXResult | null;
  error: string | null;
}

export const ACXCheckContainer: React.FC = () => {
  const [files, setFiles] = useState<FileWithResult[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    addFiles(selectedFiles);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
  };

  const addFiles = (newFiles: File[]) => {
    const audioFiles = newFiles.filter(file => file.type.startsWith('audio/'));
    const fileObjects: FileWithResult[] = audioFiles.map(file => ({
      file,
      analyzing: false,
      result: null,
      error: null,
    }));
    setFiles(prev => [...prev, ...fileObjects]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const analyzeFile = async (index: number) => {
    const fileObj = files[index];
    if (!fileObj || fileObj.analyzing) return;

    setFiles(prev => prev.map((f, i) =>
      i === index ? { ...f, analyzing: true, error: null, result: null } : f
    ));

    try {
      console.log('[ACX Frontend] Starting analysis for:', fileObj.file.name);
      
      const formData = new FormData();
      formData.append('file', fileObj.file);

      const response = await fetch('/api/acx-check', {
        method: 'POST',
        body: formData,
      });

      console.log('[ACX Frontend] Response status:', response.status);

      const data = await response.json();
      
      console.log('[ACX Frontend] Response data:', data);

      if (!response.ok) {
        console.error('[ACX Frontend] Error response:', data);
        throw new Error(data.error || 'Analysis failed');
      }

      console.log('[ACX Frontend] Analysis successful');
      setFiles(prev => prev.map((f, i) =>
        i === index ? { ...f, analyzing: false, result: data } : f
      ));
    } catch (err) {
      console.error('[ACX Frontend] Catch block error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during analysis';
      console.error('[ACX Frontend] Error message:', errorMessage);
      setFiles(prev => prev.map((f, i) =>
        i === index ? {
          ...f,
          analyzing: false,
          error: errorMessage
        } : f
      ));
    }
  };

  const analyzeAll = async () => {
    for (let i = 0; i < files.length; i++) {
      if (!files[i].result && !files[i].analyzing && !files[i].error) {
        await analyzeFile(i);
      }
    }
  };

  const exportToCSV = () => {
    const analyzedFiles = files.filter(f => f.result);
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
      'Trail Silence (s)'
    ];

    const rows = analyzedFiles.map(f => {
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
        r.silence.trail
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
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

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const hasUnanalyzedFiles = files.some(f => !f.result && !f.analyzing && !f.error);
  const isAnalyzing = files.some(f => f.analyzing);
  const hasResults = files.some(f => f.result);

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      {/* Page Header */}
      <div className="w-full border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 px-4 md:px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              ACX Audio Compliance Checker
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Analyze audiobook files for ACX technical requirements compliance
            </p>
          </div>
        </div>
      </div>

      <main className="w-full max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* Top Section: Upload + Info */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Upload Section */}
          <div className="lg:col-span-7">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Upload Audio Files
              </h2>

              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive 
                    ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/10' 
                    : 'border-slate-300 dark:border-slate-600 hover:border-blue-500 dark:hover:border-blue-400'
                }`}
              >
                <input
                  type="file"
                  id="audio-file"
                  accept="audio/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="audio-file"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className="w-12 h-12 text-slate-400 dark:text-slate-500 mb-3" />
                  <p className="text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    MP3, WAV, FLAC, or other audio formats (multiple files supported)
                  </p>
                </label>
              </div>

              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {files.map((fileObj, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileAudio className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                        <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {fileObj.file.name}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">
                          ({(fileObj.file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {fileObj.analyzing && (
                          <span className="text-xs text-blue-600 dark:text-blue-400">Analyzing...</span>
                        )}
                        {fileObj.result && (
                          <span className={`text-xs font-medium ${
                            fileObj.result.overallPass 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {fileObj.result.overallPass ? '✓ Pass' : '✗ Fail'}
                          </span>
                        )}
                        {fileObj.error && (
                          <span className="text-xs text-red-600 dark:text-red-400">Error</span>
                        )}
                        <button
                          onClick={() => removeFile(index)}
                          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                          disabled={fileObj.analyzing}
                        >
                          <Trash2 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {files.length > 0 && (
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={analyzeAll}
                    disabled={!hasUnanalyzedFiles || isAnalyzing}
                    className="flex-1 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-base shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-blue-600 disabled:hover:to-indigo-600"
                  >
                    {isAnalyzing ? 'Analyzing Files...' : 'Analyze All Files'}
                  </button>
                  {hasResults && (
                    <button
                      onClick={exportToCSV}
                      className="px-4 py-3 rounded-lg bg-green-600 text-white font-semibold text-base shadow-lg hover:bg-green-700 transition-all flex items-center gap-2"
                    >
                      <Download className="w-5 h-5" />
                      Export CSV
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Info Section */}
          <div className="lg:col-span-5 space-y-6">
            {/* ACX Requirements */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                ACX Technical Requirements
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-slate-700 dark:text-slate-300 font-medium">MP3 Format</p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs">192 kbps or higher, Constant Bit Rate (CBR)</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-slate-700 dark:text-slate-300 font-medium">44.1 kHz Sample Rate</p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs">CD quality audio sample rate</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-slate-700 dark:text-slate-300 font-medium">RMS: -23dB to -18dB</p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs">Average loudness (typically -20dB)</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-slate-700 dark:text-slate-300 font-medium">Peak: ≤ -3dB</p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs">Maximum loudness level</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Resources */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
              <h3 className="text-base font-semibold text-blue-900 dark:text-blue-100 mb-3">
                Resources
              </h3>
              <div className="space-y-2">
                <a
                  href="https://www.acx.com/help/acx-audio-submission-requirements/201456300"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300 hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  Official ACX Audio Requirements
                </a>
                <a
                  href="https://www.trevorohare.com/blog/understanding-the-acx-submission-requirements-for-audio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300 hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  Understanding the ACX requirements for audio
                </a>
                <a
                  href="https://help.acx.com/s/article/the-acx-producer-s-checklist?utm_source=chatgpt.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300 hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  The ACX Producer's Checklist
                </a>
                <a
                  href="https://www.acx.com/audiolab?utm_source=chatgpt.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300 hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  ACX Audio Lab
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Full-Width Results Section */}
        {hasResults && (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Compliance Results
                </h2>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  {files.filter(f => f.result).length} file{files.filter(f => f.result).length !== 1 ? 's' : ''} analyzed
                </div>
              </div>

              {/* Summary Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-slate-200 dark:border-slate-700">
                      <th className="text-left py-3 px-3 font-semibold text-slate-700 dark:text-slate-300">Filename</th>
                      <th className="text-center py-3 px-3 font-semibold text-slate-700 dark:text-slate-300">Status</th>
                      <th className="text-center py-3 px-3 font-semibold text-slate-700 dark:text-slate-300">Format</th>
                      <th className="text-center py-3 px-3 font-semibold text-slate-700 dark:text-slate-300">Sample Rate</th>
                      <th className="text-center py-3 px-3 font-semibold text-slate-700 dark:text-slate-300">RMS (LUFS)</th>
                      <th className="text-center py-3 px-3 font-semibold text-slate-700 dark:text-slate-300">Peak</th>
                      <th className="text-center py-3 px-3 font-semibold text-slate-700 dark:text-slate-300">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {files.map((fileObj, index) => 
                      fileObj.result && (
                        <tr 
                          key={index}
                          className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                        >
                          <td className="py-4 px-3" title={fileObj.file.name}>
                            <div className="font-medium text-slate-900 dark:text-white truncate max-w-xs">
                              {fileObj.file.name}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              {(fileObj.file.size / 1024 / 1024).toFixed(2)} MB • {fileObj.result.channels}
                            </div>
                          </td>
                          <td className="py-4 px-3 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                              fileObj.result.overallPass
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            }`}>
                              {fileObj.result.overallPass ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                              {fileObj.result.overallPass ? 'PASS' : 'FAIL'}
                            </span>
                          </td>
                          <td className="py-4 px-3 text-center">
                            <div className="flex flex-col items-center gap-1">
                              {fileObj.result.format.ok ? (
                                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                              )}
                              <span className="text-xs text-slate-600 dark:text-slate-400">
                                {fileObj.result.format.bitrate_kbps}kbps
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-3 text-center">
                            <div className="flex flex-col items-center gap-1">
                              {fileObj.result.sampleRate.ok ? (
                                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                              )}
                              <span className="text-xs text-slate-600 dark:text-slate-400">
                                {(fileObj.result.sampleRate.value / 1000).toFixed(1)}kHz
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-3 text-center">
                            <div className="flex flex-col items-center gap-1">
                              {fileObj.result.rms.ok ? (
                                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                              )}
                              <span className={`text-xs font-medium ${fileObj.result.rms.ok ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {fileObj.result.rms.value} dB
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-3 text-center">
                            <div className="flex flex-col items-center gap-1">
                              {fileObj.result.peak.ok ? (
                                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                              )}
                              <span className={`text-xs font-medium ${fileObj.result.peak.ok ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {fileObj.result.peak.value} dB
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-3 text-center">
                            <div className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                              {formatDuration(fileObj.result.duration)}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              {fileObj.result.silence.lead.toFixed(1)}s / {fileObj.result.silence.trail.toFixed(1)}s
                            </div>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>

              {/* Error rows */}
              {files.some(f => f.error) && (
                <div className="mt-6 space-y-2">
                  <h3 className="text-sm font-semibold text-red-900 dark:text-red-100 mb-2">Errors</h3>
                  {files.map((fileObj, index) => 
                    fileObj.error && (
                      <div key={`error-${index}`} className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <div className="flex items-start gap-2">
                          <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-red-900 dark:text-red-100">{fileObj.file.name}</p>
                            <p className="text-xs text-red-800 dark:text-red-200 mt-0.5">{fileObj.error}</p>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}

              {/* Analysis Only Notice */}
              <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-1">
                      Analysis Only
                    </h3>
                    <p className="text-xs text-amber-800 dark:text-amber-200">
                      This tool provides compliance checking only. It does not modify your audio files.
                      If your file fails compliance, you will need to re-master it using audio editing software.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
