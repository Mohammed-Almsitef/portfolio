import { NextResponse, type NextRequest } from 'next/server'

import { gateStatus } from '@/lib/manager/auth'
import { verifySession } from '@/lib/manager/crypto'

/**
 * Password gate in front of the manager.
 *
 * `proxy.ts` replaced `middleware.ts` in Next 16 and runs on the Node.js
 * runtime, so the session HMAC is verified with node:crypto rather than a
 * Web Crypto stand-in.
 *
 * Only the manager routes are matched, so nothing here touches the portfolio
 * itself — the public site keeps rendering statically.
 */

const SESSION_COOKIE = 'manager_session'

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  // Fast path: a valid session skips the store lookup entirely, so editing in
  // the manager doesn't pay a round trip to Redis on every API call.
  if (verifySession(request.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.next()
  }

  const status = await gateStatus()

  if (status.protection === 'open') return NextResponse.next()

  const isApi = pathname.startsWith('/api/')

  if (status.protection === 'locked') {
    // The store is configured but unreachable. Failing closed keeps a blip
    // from quietly exposing the manager.
    return isApi
      ? NextResponse.json({ error: status.reason }, { status: 503 })
      : NextResponse.redirect(new URL('/manager/login?error=store', request.nextUrl))
  }

  if (isApi) {
    return NextResponse.json({ error: 'Not signed in to the manager.' }, { status: 401 })
  }

  const login = new URL('/manager/login', request.nextUrl)
  login.searchParams.set('from', pathname + search)
  return NextResponse.redirect(login)
}

export const config = {
  matcher: ['/keystatic', '/keystatic/:path*', '/api/keystatic/:path*'],
}
