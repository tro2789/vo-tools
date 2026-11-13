import { describe, it, expect } from 'vitest';
import { execFileSync } from 'child_process';
import type { NextRequest } from 'next/server';
import { POST } from './route';

const hasFfmpeg = (() => {
  try {
    execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
})();

function convertRequest(files: File[], formats: string[]): NextRequest {
  const formData = new FormData();
  for (const file of files) formData.append('file', file);
  for (const format of formats) formData.append('format', format);
  formData.append('volume', 'medium');

  return new Request('http://localhost/api/convert', {
    method: 'POST',
    body: formData,
  }) as unknown as NextRequest;
}

/** One second of 440 Hz tone as a WAV file, made by FFmpeg. */
function toneWav(name: string): File {
  const wav = execFileSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error',
    '-f', 'lavfi', '-i', 'sine=frequency=440:duration=1',
    '-f', 'wav', 'pipe:1',
  ]);
  return new File([wav], name, { type: 'audio/wav' });
}

function previewRequest(files: File[]): NextRequest {
  const formData = new FormData();
  for (const file of files) formData.append('file', file);
  formData.append('format', 'ulaw');
  formData.append('volume', 'medium');
  formData.append('preview', 'yes');

  return new Request('http://localhost/api/convert', {
    method: 'POST',
    body: formData,
  }) as unknown as NextRequest;
}

describe('POST /api/convert preview mode', () => {
  it('rejects a preview request that carries more than one file', async () => {
    const response = await POST(
      previewRequest([
        new File(['one'], 'one.wav', { type: 'audio/wav' }),
        new File(['two'], 'two.wav', { type: 'audio/wav' }),
      ])
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'Preview requires exactly one file',
    });
  });
});

describe('POST /api/convert multiple formats', () => {
  it('rejects the request when any requested format is unknown', async () => {
    const response = await POST(
      convertRequest([new File(['x'], 'take.wav', { type: 'audio/wav' })], ['ulaw', 'mp3'])
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Invalid format: mp3' });
  });

  it.skipIf(!hasFfmpeg)('names a single output after its format', async () => {
    const response = await POST(convertRequest([toneWav('Take 1.wav')], ['alaw']));

    expect(response.status).toBe(200);
    expect(response.headers.get('content-disposition')).toContain('filename="Take 1_alaw.wav"');
  });

  it.skipIf(!hasFfmpeg)('returns one file per format in a ZIP named after the input', async () => {
    const response = await POST(convertRequest([toneWav('Take1.wav')], ['ulaw', 'alaw', 'g722']));

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('application/zip');
    expect(response.headers.get('content-disposition')).toContain('filename="Take1.zip"');

    // ZIP local file headers carry each entry name in plain text.
    const zip = Buffer.from(await response.arrayBuffer()).toString('latin1');
    for (const name of ['Take1_ulaw.wav', 'Take1_alaw.wav', 'Take1_g722.g722']) {
      expect(zip).toContain(name);
    }
  });
});
