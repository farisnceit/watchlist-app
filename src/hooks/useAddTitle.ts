import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabase } from "../lib/supabaseClient";
import { withAccessCode } from "../lib/withAccessCode";
import { useAccessCode } from "../context/AccessCodeContext";
import type { Status, TmdbTitleDetails, Title } from "../types";

interface SeasonEpisodesResponse {
  seasons: Record<string, unknown>[];
  episodes: Record<string, unknown>[];
}

export function useAddTitle() {
  const queryClient = useQueryClient();
  const { requestAccessCode } = useAccessCode();

  return useMutation({
    mutationFn: async ({ details, status }: { details: TmdbTitleDetails; status: Status }) => {
      const inserted = await withAccessCode(requestAccessCode, () =>
        getSupabase()
          .from("titles")
          .insert({ ...details, status })
          .select()
          .single(),
      );

      // Best-effort: a newly added show also gets its season/episode list
      // synced immediately (see ROADMAP.md §3), but that failing shouldn't
      // block the add itself — the periodic resync will pick it up later.
      if (inserted && details.media_type === "show") {
        try {
          const titleId = (inserted as Title).id;
          const seasonData = await withAccessCode(requestAccessCode, () =>
            getSupabase().functions.invoke<SeasonEpisodesResponse>("tmdb-proxy", {
              body: { action: "season_episodes", tmdb_id: details.tmdb_id },
            }),
          );
          if (seasonData?.seasons.length) {
            await withAccessCode(requestAccessCode, () =>
              getSupabase()
                .from("title_seasons")
                .insert(seasonData.seasons.map((s) => ({ ...s, title_id: titleId }))),
            );
          }
          if (seasonData?.episodes.length) {
            await withAccessCode(requestAccessCode, () =>
              getSupabase()
                .from("title_episodes")
                .insert(seasonData.episodes.map((e) => ({ ...e, title_id: titleId, watched: false }))),
            );
          }
        } catch {
          // swallow — see comment above
        }
      }

      return inserted;
    },
    onSuccess: (_data, { details }) => {
      queryClient.invalidateQueries({ queryKey: ["titles", details.media_type] });
    },
  });
}
