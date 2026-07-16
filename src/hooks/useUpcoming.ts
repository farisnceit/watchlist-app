import { useQuery } from "@tanstack/react-query";
import { getSupabase } from "../lib/supabaseClient";
import type { Title, TmdbUpcomingMovie } from "../types";

export interface UpcomingItem {
  key: string;
  media_type: "movie" | "show";
  name: string;
  year: number | null;
  poster_url: string | null;
  date: string;
  episodeLabel: string | null;
  /** Present only for items already in your watchlist — lets the card open
   * the full TitleDetail view. Discovery-only TMDB movies have no title. */
  title: Title | null;
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

      const [movies, shows, discovery] = await Promise.all([
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
        supabase
          .from("tmdb_upcoming_movies")
          .select("*")
          .gte("release_date", today)
          .lte("release_date", cutoff)
          .order("release_date", { ascending: true }),
      ]);
      if (movies.error) throw movies.error;
      if (shows.error) throw shows.error;
      if (discovery.error) throw discovery.error;

      const ownMovieTmdbIds = new Set((movies.data as Title[]).map((t) => t.tmdb_id));

      const items: UpcomingItem[] = [
        ...(movies.data as Title[]).map((title) => ({
          key: `title:${title.id}`,
          media_type: "movie" as const,
          name: title.name,
          year: title.year,
          poster_url: title.poster_url,
          date: title.release_date as string,
          episodeLabel: null,
          title,
        })),
        ...(shows.data as Title[]).map((title) => ({
          key: `title:${title.id}`,
          media_type: "show" as const,
          name: title.name,
          year: title.year,
          poster_url: title.poster_url,
          date: title.next_episode_air_date as string,
          episodeLabel:
            title.next_episode_season != null && title.next_episode_number != null
              ? `S${title.next_episode_season}E${title.next_episode_number}`
              : null,
          title,
        })),
        // TMDB's general "releasing soon" list — skip any already in your
        // own Watch later (already shown above, backed by a real Title).
        ...(discovery.data as TmdbUpcomingMovie[])
          .filter((m) => !ownMovieTmdbIds.has(m.tmdb_id))
          .map((m) => ({
            key: `discovery:${m.tmdb_id}`,
            media_type: "movie" as const,
            name: m.name,
            year: m.release_date ? Number(m.release_date.slice(0, 4)) : null,
            poster_url: m.poster_url,
            date: m.release_date,
            episodeLabel: null,
            title: null,
          })),
      ];
      items.sort((a, b) => a.date.localeCompare(b.date));
      return items;
    },
  });
}
