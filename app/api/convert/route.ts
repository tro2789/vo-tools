import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, rm, readFile } from 'fs/promises';
import { createWriteStream } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import archiver from 'archiver';
import { isValidAudio } from '@/lib/audio/ffmpeg';
import {
  isAllowedFile,
  isValidFormat,
  isValidVolume,
  sanitizeFilename,
  buildAudioFilters,
  convertFile,
  EXTENSIONS,
  SUFFIXES,
  VolumeLevel,
} from '@/lib/audio/convert';

const UPLOAD_FOLDER = process.env.UPLOAD_FOLDER || '/tmp/uploads';
const MAX_CONTENT_LENGTH = parseInt(process.env.MAX_CONTENT_LENGTH || String(50 * 1024 * 1024), 10);

export async function POST(request: NextRequest) {
  const jobId = randomUUID();
  const jobDir = path.join(UPLOAD_FOLDER, jobId);

  try {
    // Check content length
    const contentLength = parseInt(request.headers.get('content-length') || '0', 10);
    if (contentLength > MAX_CONTENT_LENGTH) {
      const maxMb = Math.floor(MAX_CONTENT_LENGTH / (1024 * 1024));
      return NextResponse.json(
        { error: `Total upload size too large. Maximum allowed: ${maxMb}MB` },
        { status: 413 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll('file') as File[];

    if (!files.length || !files[0].name) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const targetFormat = (formData.get('format') as string) || 'ulaw';
    if (!isValidFormat(targetFormat)) {
      return NextResponse.json({ error: `Invalid format: ${targetFormat}` }, { status: 400 });
    }

    const volume = (formData.get('volume') as string) || 'medium';
    if (!isValidVolume(volume)) {
      return NextResponse.json({ error: `Invalid volume: ${volume}` }, { status: 400 });
    }

    await mkdir(jobDir, { recursive: true });

    const audioFilters = buildAudioFilters(volume as VolumeLevel, formData.get('optimize') === 'yes');
    const ext = EXTENSIONS[targetFormat] || '.wav';
    const suffix = SUFFIXES[targetFormat] || '_converted';

    const convertedFiles: string[] = [];
    const errors: string[] = [];

    for (const file of files) {
      if (!isAllowedFile(file.name)) {
        errors.push(`Skipped ${file.name}: Invalid file type`);
        continue;
      }

      const safeName = sanitizeFilename(file.name);
      if (!safeName) {
        errors.push(`Skipped ${file.name}: Invalid filename`);
        continue;
      }

      const inputPath = path.join(jobDir, safeName);

      // Save uploaded file
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        await writeFile(inputPath, buffer);
      } catch {
        errors.push(`Failed to save ${file.name}`);
        continue;
      }

      // Validate audio
      if (!(await isValidAudio(inputPath))) {
        errors.push(`Skipped ${file.name}: Not a valid audio file`);
        await rm(inputPath, { force: true });
        continue;
      }

      // Convert
      const originalName = path.parse(safeName).name;
      const outputFilename = `${originalName}${suffix}${ext}`;
      const outputPath = path.join(jobDir, outputFilename);

      try {
        await convertFile(inputPath, outputPath, targetFormat, audioFilters);
        convertedFiles.push(outputPath);
        await rm(inputPath, { force: true });
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Audio conversion failed';
        errors.push(`Failed to convert ${file.name}: ${msg}`);
        await rm(inputPath, { force: true });
      }
    }

    if (!convertedFiles.length) {
      await rm(jobDir, { recursive: true, force: true });
      return NextResponse.json(
        { error: `No files were converted. ${errors.join('; ')}` },
        { status: 422 }
      );
    }

    // Single file - return directly
    if (convertedFiles.length === 1) {
      const fileBuffer = await readFile(convertedFiles[0]);
      const filename = path.basename(convertedFiles[0]);
      await rm(jobDir, { recursive: true, force: true });
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    // Multiple files - zip them
    const zipFilename = `batch_converted_${jobId.slice(0, 8)}.zip`;
    const zipPath = path.join(jobDir, zipFilename);

    await new Promise<void>((resolve, reject) => {
      const output = createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 1 } });
      output.on('close', resolve);
      archive.on('error', reject);
      archive.pipe(output);
      for (const f of convertedFiles) {
        archive.file(f, { name: path.basename(f) });
      }
      archive.finalize();
    });

    const zipBuffer = await readFile(zipPath);
    await rm(jobDir, { recursive: true, force: true });
    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipFilename}"`,
      },
    });
  } catch (error) {
    console.error('Unexpected error in convert endpoint:', error);
    await rm(jobDir, { recursive: true, force: true }).catch(() => {});
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
