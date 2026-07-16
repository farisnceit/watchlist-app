import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabase } from "../lib/supabaseClient";
import { withAccessCode } from "../lib/withAccessCode";
import { useAccessCode } from "../context/AccessCodeContext";
import type { Status, TmdbTitleDetails } from "../types";

export function useAddTitle() {
  const queryClient = useQueryClient();
  const { requestAccessCode } = useAccessCode();

  return useMutation({
    mutationFn: async ({ details, status }: { details: TmdbTitleDetails; status: Status }) =>
      withAccessCode(requestAccessCode, () =>
        getSupabase()
          .from("titles")
          .insert({ ...details, status })
          .select()
          .single(),
      ),
    onSuccess: (_data, { details }) => {
      queryClient.invalidateQueries({ queryKey: ["titles", details.media_type] });
    },
  });
}
