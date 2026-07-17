import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "../lib/supabaseClient";
import { withAccessCode } from "../lib/withAccessCode";
import { useAccessCode } from "../context/AccessCodeContext";
import type { SwipeCandidate } from "../types";

export interface SearchFilters {
  genreIds: number[];
  minRating: number;
  sortBy: string;
}

interface DiscoverResponse {
  results: SwipeCandidate[];
  page: number;
  total_pages: number;
}

/** Backs the Advance search page (ROADMAP.md Phase 4): re-runs a fresh
 * TMDB /discover/movie query whenever the filters change, with a
 * "load more" for subsequent pages of the same filter set. */
export function useAdvanceSearch(filters: SearchFilters) {
  const { requestAccessCode } = useAccessCode();
  const [results, setResults] = useState<SwipeCandidate[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const genreKey = filters.genreIds.join(",");

  const runSearch = useCallback(
    async (targetPage: number, replace: boolean) => {
      setLoading(true);
      setError(null);
      try {
        const result = await withAccessCode(requestAccessCode, () =>
          getSupabase().functions.invoke<DiscoverResponse>("tmdb-proxy", {
            body: {
              action: "discover",
              page: targetPage,
              genre_ids: filters.genreIds,
              min_rating: filters.minRating || undefined,
              sort_by: filters.sortBy,
            },
          }),
        );
        setResults((prev) => (replace ? result?.results ?? [] : [...prev, ...(result?.results ?? [])]));
        setPage(result?.page ?? targetPage);
        setTotalPages(result?.total_pages ?? 1);
      } catch (e) {
        setError(e as Error);
      } finally {
        setLoading(false);
      }
    },
    // genreKey stands in for filters.genreIds (array identity changes every render)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [genreKey, filters.minRating, filters.sortBy, requestAccessCode],
  );

  useEffect(() => {
    runSearch(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [genreKey, filters.minRating, filters.sortBy]);

  const loadMore = useCallback(() => {
    if (!loading && page < totalPages) runSearch(page + 1, false);
  }, [loading, page, totalPages, runSearch]);

  return { results, loading, error, loadMore, hasMore: page < totalPages };
}
