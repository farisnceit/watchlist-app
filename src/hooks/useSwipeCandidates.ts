import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabase } from "../lib/supabaseClient";
import { withAccessCode } from "../lib/withAccessCode";
import { useAccessCode } from "../context/AccessCodeContext";
import type { SwipeCandidate } from "../types";

const BUFFER_TARGET = 6;
const MAX_PAGES_PER_FETCH = 4;

/** Feeds the Discover swipe page: pulls pages from tmdb-proxy's
 * "swipe_feed" action, filtering out movies already in the watchlist or
 * already swiped left on (see ROADMAP.md Phase 3), and keeps a small
 * buffer topped up as the user swipes through it. */
export function useSwipeCandidates() {
  const { requestAccessCode } = useAccessCode();
  const [queue, setQueue] = useState<SwipeCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const pageRef = useRef(1);
  const excludeRef = useRef<Set<number> | null>(null);
  const seenRef = useRef<Set<number>>(new Set());
  const fetchingRef = useRef(false);

  const loadExcludeSet = useCallback(async () => {
    if (excludeRef.current) return excludeRef.current;
    const supabase = getSupabase();
    const [owned, skipped] = await Promise.all([
      supabase.from("titles").select("tmdb_id").eq("media_type", "movie"),
      supabase.from("tmdb_swipe_skips").select("tmdb_id"),
    ]);
    if (owned.error) throw owned.error;
    if (skipped.error) throw skipped.error;
    const set = new Set<number>();
    for (const row of (owned.data ?? []) as { tmdb_id: number | null }[]) {
      if (row.tmdb_id != null) set.add(row.tmdb_id);
    }
    for (const row of (skipped.data ?? []) as { tmdb_id: number }[]) set.add(row.tmdb_id);
    excludeRef.current = set;
    return set;
  }, []);

  const fetchMore = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const exclude = await loadExcludeSet();
      const supabase = getSupabase();
      for (let tries = 0; tries < MAX_PAGES_PER_FETCH; tries++) {
        const page = pageRef.current++;
        const result = await withAccessCode(requestAccessCode, () =>
          supabase.functions.invoke<{ results: SwipeCandidate[] }>("tmdb-proxy", {
            body: { action: "swipe_feed", page },
          }),
        );
        const fresh = (result?.results ?? []).filter(
          (c) => !exclude.has(c.tmdb_id) && !seenRef.current.has(c.tmdb_id),
        );
        fresh.forEach((c) => seenRef.current.add(c.tmdb_id));
        if (fresh.length) setQueue((q) => [...q, ...fresh]);
        if (fresh.length >= BUFFER_TARGET) break;
      }
    } catch (e) {
      setError(e as Error);
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  }, [loadExcludeSet, requestAccessCode]);

  useEffect(() => {
    fetchMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loading && queue.length < BUFFER_TARGET) fetchMore();
  }, [queue.length, loading, fetchMore]);

  /** Removes a candidate from the front of the queue after a swipe decision,
   * and marks it excluded so it can never resurface even if fetchMore
   * re-scans an earlier page. */
  const advance = useCallback((tmdbId: number) => {
    setQueue((q) => q.filter((c) => c.tmdb_id !== tmdbId));
    excludeRef.current?.add(tmdbId);
  }, []);

  return { queue, loading, error, advance };
}
