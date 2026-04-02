// =============================================================================
// Supabase Browser Client — Client-side adapter
// =============================================================================
// This wrapper provides a singleton Supabase client for browser-side usage.
// It only uses the ANON key and respects RLS. Never expose service role here.
// =============================================================================

import { createBrowserClient } from "@supabase/ssr";

/**
 * Creates a Supabase client for use in Client Components.
 * Uses the public ANON key — all queries are subject to Row Level Security.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
