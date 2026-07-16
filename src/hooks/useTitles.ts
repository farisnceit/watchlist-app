import { useQuery } from "@tanstack/react-query";
import { getSupabase } from "../lib/supabaseClient";
import type { MediaType, Title } from "../types";

export function useTitles(mediaType: MediaType, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["titles", mediaType],
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from("titles")
        .select("*")
        .eq("media_type", mediaType)
        .order("added_at", { ascending: false });
      if (error) throw error;
      return data as Title[];
    },
    enabled: options?.enabled ?? true,
  });
}
