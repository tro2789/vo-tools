import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get the Flask API URL (internal Docker network)
    const flaskUrl = process.env.FLASK_API_URL || 'http://localhost:5000';
    const apiKey = process.env.API_KEY;
    
    console.log('[ACX Check] Starting request to Flask API');
    
    // Forward the request to Flask API
    const formData = await request.formData();
    
    // Prepare headers with API key if available
    const headers: HeadersInit = {};
    if (apiKey) {
      headers['X-API-Key'] = apiKey;
    }
    
    console.log('[ACX Check] Forwarding to:', `${flaskUrl}/api/audio/acx-check`);
    
    const response = await fetch(`${flaskUrl}/api/audio/acx-check`, {
      method: 'POST',
      body: formData,
      headers,
    });

    console.log('[ACX Check] Flask response status:', response.status);

    const data = await response.json();
    
    console.log('[ACX Check] Flask response data:', data);

    if (!response.ok) {
      console.error('[ACX Check] Flask returned error:', data);
      return NextResponse.json(
        { error: data.error || 'Analysis failed' },
        { status: response.status }
      );
    }

    // Return the JSON response
    return NextResponse.json(data, {
      status: 200,
    });
  } catch (error) {
    console.error('[ACX Check] Proxy error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process ACX compliance check request' },
      { status: 500 }
    );
  }
}
