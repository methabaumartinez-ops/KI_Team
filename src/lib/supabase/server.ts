// =============================================================================
// Supabase Server Client — SSR adapter for Next.js App Router
// =============================================================================
// This wrapper isolates the Supabase dependency behind a factory function.
// If we ever swap Supabase for another provider, only this file changes.
// =============================================================================

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Creates a Supabase client scoped to the current server request.
 * Reads and writes cookies via Next.js `cookies()` to maintain auth sessions.
 *
 * Usage: Always call inside Server Components, Route Handlers, or Server Actions.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // setAll may fail inside Server Components (read-only context).
            // This is expected — it only matters in Route Handlers / Server Actions.
          }
        },
      },
    }
  );
}

/**
 * Creates a Supabase admin client using the service role key.
 * Bypasses RLS — use ONLY for server-side operations like agent execution logging.
 */
export function createSupabaseAdminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // Admin client does not interact with user cookies.
        },
      },
    }
  );
}
