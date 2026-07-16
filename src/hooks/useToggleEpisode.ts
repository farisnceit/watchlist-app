import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabase } from "../lib/supabaseClient";
import { withAccessCode } from "../lib/withAccessCode";
import { useAccessCode } from "../context/AccessCodeContext";
import type { TitleEpisode, TitleSeason } from "../types";

interface EpisodesCache {
  seasons: TitleSeason[];
  episodes: TitleEpisode[];
}

export function useToggleEpisode(titleId: string) {
  const queryClient = useQueryClient();
  const { requestAccessCode } = useAccessCode();

  return useMutation({
    mutationFn: async (episode: TitleEpisode) => {
      const watched = !episode.watched;
      const result = await withAccessCode(requestAccessCode, () =>
        getSupabase()
          .from("title_episodes")
          .update({ watched, watched_at: watched ? new Date().toISOString() : null })
          .eq("id", episode.id),
      );

      // Keep titles.watched_episode_count in sync — TitleCard's progress
      // bar still reads that column rather than joining title_episodes on
      // every list render (see ROADMAP.md §3).
      const cache = queryClient.getQueryData<EpisodesCache>(["episodes", titleId]);
      if (cache) {
        const watchedCount = cache.episodes.filter((e) =>
          e.id === episode.id ? watched : e.watched,
        ).length;
        await withAccessCode(requestAccessCode, () =>
          getSupabase()
            .from("titles")
            .update({ watched_episode_count: watchedCount })
            .eq("id", titleId),
        );
      }

      return result;
    },
    onMutate: async (episode) => {
      await queryClient.cancelQueries({ queryKey: ["episodes", titleId] });
      const previous = queryClient.getQueryData<EpisodesCache>(["episodes", titleId]);
      queryClient.setQueryData<EpisodesCache>(["episodes", titleId], (old) =>
        old
          ? {
              ...old,
              episodes: old.episodes.map((e) =>
                e.id === episode.id ? { ...e, watched: !e.watched } : e,
              ),
            }
          : old,
      );
      return { previous };
    },
    onError: (_err, _episode, context) => {
      if (context?.previous) queryClient.setQueryData(["episodes", titleId], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["episodes", titleId] });
      queryClient.invalidateQueries({ queryKey: ["titles", "show"] });
    },
  });
}
