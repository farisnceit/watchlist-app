import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabase } from "../lib/supabaseClient";
import { withAccessCode } from "../lib/withAccessCode";
import { useAccessCode } from "../context/AccessCodeContext";
import type { Status, Title } from "../types";

export function useMutateTitle() {
  const queryClient = useQueryClient();
  const { requestAccessCode } = useAccessCode();

  function invalidate(mediaType: Title["media_type"]) {
    queryClient.invalidateQueries({ queryKey: ["titles", mediaType] });
  }

  const toggleFavourite = useMutation({
    mutationFn: async (title: Title) =>
      withAccessCode(requestAccessCode, () =>
        getSupabase()
          .from("titles")
          .update({
            is_favourite: !title.is_favourite,
            updated_at: new Date().toISOString(),
          })
          .eq("id", title.id),
      ),
    onMutate: async (title) => {
      await queryClient.cancelQueries({ queryKey: ["titles", title.media_type] });
      const previous = queryClient.getQueryData<Title[]>(["titles", title.media_type]);
      queryClient.setQueryData<Title[]>(["titles", title.media_type], (old) =>
        old?.map((t) => (t.id === title.id ? { ...t, is_favourite: !t.is_favourite } : t)),
      );
      return { previous, mediaType: title.media_type };
    },
    onError: (_err, _title, context) => {
      if (context) queryClient.setQueryData(["titles", context.mediaType], context.previous);
    },
    onSettled: (_data, _err, title) => invalidate(title.media_type),
  });

  const changeStatus = useMutation({
    mutationFn: async ({ title, status }: { title: Title; status: Status }) =>
      withAccessCode(requestAccessCode, () =>
        getSupabase()
          .from("titles")
          .update({
            status,
            watched_at: status === "watched" ? new Date().toISOString() : title.watched_at,
            updated_at: new Date().toISOString(),
          })
          .eq("id", title.id),
      ),
    onMutate: async ({ title, status }) => {
      await queryClient.cancelQueries({ queryKey: ["titles", title.media_type] });
      const previous = queryClient.getQueryData<Title[]>(["titles", title.media_type]);
      queryClient.setQueryData<Title[]>(["titles", title.media_type], (old) =>
        old?.map((t) => (t.id === title.id ? { ...t, status } : t)),
      );
      return { previous, mediaType: title.media_type };
    },
    onError: (_err, _vars, context) => {
      if (context) queryClient.setQueryData(["titles", context.mediaType], context.previous);
    },
    onSettled: (_data, _err, vars) => invalidate(vars.title.media_type),
  });

  return { toggleFavourite, changeStatus };
}
