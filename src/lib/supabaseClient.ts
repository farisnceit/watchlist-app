import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getAccessCode } from "./accessCode";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — copy .env.local.example to .env.local and fill it in.",
  );
}

function buildClient(): SupabaseClient {
  const code = getAccessCode();
  return createClient(url, anonKey, {
    global: {
      headers: code ? { "x-app-secret": code } : {},
    },
  });
}

let client = buildClient();

/** Current Supabase client. Call refreshSupabaseClient() after the access
 * code changes (set/cleared) to pick up the new x-app-secret header — the
 * client's headers are fixed at construction time, not read per-request. */
export function getSupabase(): SupabaseClient {
  return client;
}

export function refreshSupabaseClient(): void {
  client = buildClient();
}
