import { useQuery } from "@tanstack/react-query";
import { getSupabase } from "../lib/supabaseClient";
import type { Title } from "../types";

export interface UpcomingItem {
  title: Title;
  date: string;
  episodeLabel: string | null;
}

export function useUpcoming() {
  return useQuery({
    queryKey: ["upcoming"],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const oneMonthOut = new Date();
      oneMonthOut.setMonth(oneMonthOut.getMonth() + 1);
      const cutoff = oneMonthOut.toISOString().slice(0, 10);
      const supabase = getSupabase();

      const [movies, shows] = await Promise.all([
        supabase
          .from("titles")
          .select("*")
          .eq("media_type", "movie")
          .eq("status", "watch_later")
          .gte("release_date", today)
          .lte("release_date", cutoff)
          .order("release_date", { ascending: true }),
        supabase
          .from("titles")
          .select("*")
          .eq("media_type", "show")
          .in("status", ["watched", "watch_later", "following"])
          .gte("next_episode_air_date", today)
          .lte("next_episode_air_date", cutoff)
          .order("next_episode_air_date", { ascending: true }),
      ]);
      if (movies.error) throw movies.error;
      if (shows.error) throw shows.error;

      const items: UpcomingItem[] = [
        ...(movies.data as Title[]).map((title) => ({
          title,
          date: title.release_date as string,
          episodeLabel: null,
        })),
        ...(shows.data as Title[]).map((title) => ({
          title,
          date: title.next_episode_air_date as string,
          episodeLabel:
            title.next_episode_season != null && title.next_episode_number != null
              ? `S${title.next_episode_season}E${title.next_episode_number}`
              : null,
        })),
      ];
      items.sort((a, b) => a.date.localeCompare(b.date));
      return items;
    },
  });
}
