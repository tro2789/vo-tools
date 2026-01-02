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
    
    const response = await fetch(`${flaskUrl}/api/audio/acx-check`, {
      method: 'POST',
      body: formData,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
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
    console.error('ACX check proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to process ACX compliance check request' },
      { status: 500 }
    );
  }
}
