import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get the Flask API URL (internal Docker network)
    const flaskUrl = process.env.FLASK_API_URL || 'http://localhost:5000';
    const apiKey = process.env.API_KEY;
    
    // Forward the request to Flask API
    const formData = await request.formData();
    
    // Prepare headers with API key if available
    const headers: HeadersInit = {};
    if (apiKey) {
      headers['X-API-Key'] = apiKey;
    }
    
    const response = await fetch(`${flaskUrl}/api/convert`, {
      method: 'POST',
      body: formData,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new NextResponse(errorText, {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get the response as blob and forward it
    const blob = await response.blob();
    const contentDisposition = response.headers.get('Content-Disposition');
    
    return new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream',
        'Content-Disposition': contentDisposition || 'attachment',
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to process conversion request' },
      { status: 500 }
    );
  }
}
