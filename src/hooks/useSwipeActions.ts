import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabase } from "../lib/supabaseClient";
import { withAccessCode } from "../lib/withAccessCode";
import { useAccessCode } from "../context/AccessCodeContext";
import type { SwipeCandidate, TmdbTitleDetails } from "../types";

/** Heart/cross actions for the Discover swipe page (see ROADMAP.md Phase 3). */
export function useSwipeActions() {
  const { requestAccessCode } = useAccessCode();
  const queryClient = useQueryClient();

  const like = useMutation({
    mutationFn: async (candidate: SwipeCandidate) => {
      const supabase = getSupabase();
      const detailsResult = await withAccessCode(requestAccessCode, () =>
        supabase.functions.invoke<{ title: TmdbTitleDetails }>("tmdb-proxy", {
          body: { action: "details", media_type: "movie", tmdb_id: candidate.tmdb_id },
        }),
      );
      const details = detailsResult?.title;
      if (!details) throw new Error("Couldn't load movie details");
      await withAccessCode(requestAccessCode, () =>
        supabase.from("titles").insert({ ...details, status: "watch_later" }).select().single(),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["titles", "movie"] });
    },
  });

  const skip = useMutation({
    mutationFn: async (candidate: SwipeCandidate) => {
      await withAccessCode(requestAccessCode, () =>
        getSupabase().from("tmdb_swipe_skips").insert({ tmdb_id: candidate.tmdb_id }),
      );
    },
  });

  return { like, skip };
}
