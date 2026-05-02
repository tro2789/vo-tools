import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || ''
  if (host.startsWith('www.')) {
    const canonical = `https://voiceover-tools.com${request.nextUrl.pathname}${request.nextUrl.search}`
    return NextResponse.redirect(canonical, 301)
  }
  return NextResponse.next()
}
