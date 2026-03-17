import { NextResponse } from 'next/server';
import { checkFfmpegAvailable } from '@/lib/audio/ffmpeg';
import fs from 'fs/promises';

const UPLOAD_FOLDER = process.env.UPLOAD_FOLDER || '/tmp/uploads';

export async function GET() {
  try {
    const ffmpegOk = await checkFfmpegAvailable();
    if (!ffmpegOk) throw new Error('FFmpeg not available');

    await fs.access(UPLOAD_FOLDER, fs.constants.R_OK);

    return NextResponse.json({
      status: 'healthy',
      service: 'vo-tools',
      version: '2.0.0',
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}
