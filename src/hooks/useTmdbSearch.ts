import { useMutation } from "@tanstack/react-query";
import { getSupabase } from "../lib/supabaseClient";
import { withAccessCode } from "../lib/withAccessCode";
import { useAccessCode } from "../context/AccessCodeContext";
import type { MediaType, TmdbSearchResult, TmdbTitleDetails } from "../types";

export function useTmdbSearch() {
  const { requestAccessCode } = useAccessCode();

  const search = useMutation({
    mutationFn: async ({ mediaType, query }: { mediaType: MediaType; query: string }) => {
      const result = await withAccessCode(requestAccessCode, () =>
        getSupabase().functions.invoke<{ results: TmdbSearchResult[] }>("tmdb-proxy", {
          body: { action: "search", media_type: mediaType, query },
        }),
      );
      return result?.results ?? [];
    },
  });

  const details = useMutation({
    mutationFn: async ({ mediaType, tmdbId }: { mediaType: MediaType; tmdbId: number }) => {
      const result = await withAccessCode(requestAccessCode, () =>
        getSupabase().functions.invoke<{ title: TmdbTitleDetails }>("tmdb-proxy", {
          body: { action: "details", media_type: mediaType, tmdb_id: tmdbId },
        }),
      );
      return result?.title ?? null;
    },
  });

  return { search, details };
}
