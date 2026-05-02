import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || ''
  if (host.startsWith('www.')) {
    const url = request.nextUrl.clone()
    url.host = host.replace('www.', '')
    return NextResponse.redirect(url, 301)
  }
  return NextResponse.next()
}
