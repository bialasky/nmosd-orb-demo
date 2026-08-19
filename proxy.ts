import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// HTTP Basic Auth gate for deployed environments. Set BASIC_AUTH_PASSWORD
// (and optionally BASIC_AUTH_USER, default "orb") to enable. When unset —
// e.g. local dev — the site stays open.
const USER = process.env.BASIC_AUTH_USER ?? "orb"
const PASSWORD = process.env.BASIC_AUTH_PASSWORD

export function proxy(request: NextRequest) {
  if (!PASSWORD) return NextResponse.next()

  const auth = request.headers.get("authorization")
  if (auth?.startsWith("Basic ")) {
    const decoded = atob(auth.slice(6))
    const separator = decoded.indexOf(":")
    const user = decoded.slice(0, separator)
    const pass = decoded.slice(separator + 1)
    if (user === USER && pass === PASSWORD) return NextResponse.next()
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="NORA Orb"' },
  })
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
