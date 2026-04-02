// =============================================================================
// AgentIA-Automate — Auth Middleware
// =============================================================================
// AUTH CURRENTLY DISABLED for local development.
// To re-enable: restore the Supabase session check below and configure .env
// =============================================================================

import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Pass all requests through — no auth enforcement in dev mode.
  return NextResponse.next({ request });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
