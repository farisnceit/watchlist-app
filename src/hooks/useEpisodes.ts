import { useQuery } from "@tanstack/react-query";
import { getSupabase } from "../lib/supabaseClient";
import type { TitleEpisode, TitleSeason } from "../types";

export function useEpisodes(titleId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["episodes", titleId],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const supabase = getSupabase();
      const [seasons, episodes] = await Promise.all([
        supabase
          .from("title_seasons")
          .select("*")
          .eq("title_id", titleId)
          .order("season_number", { ascending: true }),
        supabase
          .from("title_episodes")
          .select("*")
          .eq("title_id", titleId)
          .order("season_number", { ascending: true })
          .order("episode_number", { ascending: true }),
      ]);
      if (seasons.error) throw seasons.error;
      if (episodes.error) throw episodes.error;
      return {
        seasons: seasons.data as TitleSeason[],
        episodes: episodes.data as TitleEpisode[],
      };
    },
  });
}
