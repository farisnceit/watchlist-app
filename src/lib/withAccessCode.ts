import { clearAccessCode } from "./accessCode";
import { refreshSupabaseClient } from "./supabaseClient";

/** True for a Postgres RLS rejection (42501 / "row-level security policy")
 * or an Edge Function 401/403 — both mean the access code is missing, wrong,
 * or stale. */
export function isAuthRejection(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as Record<string, unknown>;
  if (e.code === "42501") return true;
  if (typeof e.message === "string" && e.message.toLowerCase().includes("row-level security")) return true;
  const context = e.context as { status?: number } | undefined;
  if (context?.status === 401 || context?.status === 403) return true;
  if (e.status === 401 || e.status === 403) return true;
  return false;
}

/** Runs a guarded Supabase call; on an auth rejection, prompts for the
 * access code (via the AccessCodeContext) and retries once. */
export async function withAccessCode<T>(
  requestAccessCode: () => Promise<void>,
  run: () => PromiseLike<{ data: T | null; error: unknown }>,
): Promise<T | null> {
  let { data, error } = await run();
  if (isAuthRejection(error)) {
    clearAccessCode();
    refreshSupabaseClient();
    await requestAccessCode();
    ({ data, error } = await run());
  }
  if (error) throw error as Error;
  return data;
}
