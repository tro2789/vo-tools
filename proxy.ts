import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Canonical-host redirect for pages only. The Cloudflare edge already 301s www
// to the apex; this is the fallback for direct hits.
//
// /api is excluded on purpose: when the proxy runs, Next.js buffers the whole
// request body in memory with a 10 MB cap (experimental.proxyClientMaxBodySize),
// which truncated audio uploads over 10 MB and made /api/convert fail with
// "Failed to parse body as FormData".
export function proxy(request: NextRequest) {
  const host = request.headers.get('host') || ''
  if (host.startsWith('www.')) {
    const canonical = `https://voiceover-tools.com${request.nextUrl.pathname}${request.nextUrl.search}`
    return NextResponse.redirect(canonical, 301)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api/|_next/|favicon.ico|icon.png|apple-icon.png).*)'],
}
