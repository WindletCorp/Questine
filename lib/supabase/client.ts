import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/db/database.types";

/**
 * Creates a Supabase client for browser use (React hooks, client components).
 * Safe to call multiple times — memoisation is handled internally by the library.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
