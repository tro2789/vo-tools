import { describe, it, expect } from 'vitest';
import type { NextRequest } from 'next/server';
import { POST } from './route';

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
