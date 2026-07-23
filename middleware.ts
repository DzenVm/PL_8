import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID())

  const csp = [
    "default-src 'self'",
    // nonce для JSON-LD + inline скриптів Next.js; unsafe-inline для старих браузерів
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-inline'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    // probe fetch + CF insights (щоб не смітило в консолі)
    "connect-src 'self' https://api.studiadesi.site https://static.cloudflareinsights.com",
    "frame-ancestors 'none'",
  ].join('; ')

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)

  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set('Content-Security-Policy', csp)
  return response
}

export const config = {
  matcher: [
    // всі маршрути крім статичних ресурсів Next.js
    '/((?!_next/static|_next/image|favicon\\.ico|apple-icon\\.svg|icon\\.svg).*)',
  ],
}
