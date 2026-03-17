import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, rm } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { isValidAudio } from '@/lib/audio/ffmpeg';
import { isAllowedFile, sanitizeFilename } from '@/lib/audio/convert';
import { analyzeAcxCompliance } from '@/lib/audio/acx-analyzer';

const UPLOAD_FOLDER = process.env.UPLOAD_FOLDER || '/tmp/uploads';

export async function POST(request: NextRequest) {
  const jobId = randomUUID();
  const jobDir = path.join(UPLOAD_FOLDER, jobId);

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file || !file.name) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!isAllowedFile(file.name)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an audio file.' },
        { status: 400 }
      );
    }

    await mkdir(jobDir, { recursive: true });

    const safeName = sanitizeFilename(file.name);
    if (!safeName) {
      await rm(jobDir, { recursive: true, force: true });
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    const filepath = path.join(jobDir, safeName);

    // Save file
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buffer);

    // Validate audio
    if (!(await isValidAudio(filepath))) {
      await rm(jobDir, { recursive: true, force: true });
      return NextResponse.json({ error: 'Not a valid audio file' }, { status: 400 });
    }

    // Analyze
    const result = await analyzeAcxCompliance(filepath);

    // Cleanup
    await rm(jobDir, { recursive: true, force: true });

    return NextResponse.json(result);
  } catch (error) {
    console.error('ACX analysis error:', error);
    await rm(jobDir, { recursive: true, force: true }).catch(() => {});
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 }
    );
  }
}
