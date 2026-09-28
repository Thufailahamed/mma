import { NextResponse, type NextRequest } from 'next/server'

const CSRF_COOKIE = 'mma_csrf'
const ONE_DAY_MS = 24 * 60 * 60 * 1000

/**
 * Issues the double-submit CSRF token to browsers that do not hold one.
 *
 * The API issues the same cookie on its own responses, but pages served by
 * Next never reach the API, so a visitor loading the homepage would reach
 * their first POST with no token to echo and be rejected. This middleware
 * closes that gap at the edge of the web app.
 *
 * It is deliberately not HttpOnly: the client has to read it and echo it in
 * the X-CSRF-Token header. It authorises nothing on its own — a forged
 * header still fails because the value must match this cookie.
 */
export function middleware(request: NextRequest) {
  if (request.cookies.has(CSRF_COOKIE)) {
    return NextResponse.next()
  }

  const bytes = new Uint8Array(24)
  crypto.getRandomValues(bytes)
  const token = btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '')

  const response = NextResponse.next()
  response.cookies.set(CSRF_COOKIE, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: ONE_DAY_MS / 1000,
  })
  return response
}

export const config = {
  // Only document requests need a token. API traffic gets one from the API.
  matcher: ['/((?!api|_next/static|_next/image|img|favicon.ico).*)'],
}
