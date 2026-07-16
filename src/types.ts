export type MediaType = "movie" | "show";
export type Status = "watched" | "watch_later" | "following" | "dropped";

export interface Title {
  id: string;
  media_type: MediaType;
  tmdb_id: number | null;
  tvdb_id: number | null;
  name: string;
  poster_url: string | null;
  year: number | null;
  genres: string[];
  overview: string | null;
  runtime_minutes: number | null;
  imdb_id: string | null;
  show_status: string | null;
  watched_episode_count: number | null;
  aired_episode_count: number | null;
  status: Status;
  is_favourite: boolean;
  watched_at: string | null;
  last_watched_at: string | null;
  added_at: string;
}

export interface TmdbSearchResult {
  tmdb_id: number;
  name: string;
  year: string | null;
  poster_url: string | null;
  overview: string | null;
}

/** Fields the tmdb-proxy Edge Function returns from its "details" action —
 * a subset of Title, ready to merge with status/is_favourite and insert. */
export type TmdbTitleDetails = Partial<Title> & {
  media_type: MediaType;
  tmdb_id: number;
  name: string;
};

export const TYPE_CONFIG: Record<
  MediaType,
  { tabs: Status[]; labels: Record<Status, string> }
> = {
  movie: {
    tabs: ["watched", "watch_later"],
    labels: {
      watched: "Watched",
      watch_later: "Watch later",
      following: "Queued",
      dropped: "Dropped",
    },
  },
  show: {
    tabs: ["watched", "watch_later", "following", "dropped"],
    labels: {
      watched: "Watched",
      watch_later: "Watch later",
      following: "Queued",
      dropped: "Dropped",
    },
  },
};
