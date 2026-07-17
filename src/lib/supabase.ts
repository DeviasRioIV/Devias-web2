// Supabase client for the server endpoint.
//
// Uses the publishable key (`sb_publishable_...`, the `anon` role), so RLS
// applies: the `contacts` table needs an INSERT policy for `anon` (see
// db/contacts.sql). No SELECT policy → the rows can't be read back through the
// public API.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Read from import.meta.env (dev/build) with a runtime fallback to process.env
// (Vercel serverless populates env vars there).
function readEnv(key: string): string | undefined {
  return (
    (import.meta.env as Record<string, string | undefined>)[key] ??
    (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.[key]
  );
}

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (client) return client;

  const url = readEnv("SUPABASE_URL");
  const key = readEnv("SUPABASE_KEY");
  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_KEY. Add them to .env " +
        "(SUPABASE_KEY is the publishable `sb_publishable_...` key).",
    );
  }

  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
