import { useMemo, useState } from "react";
import { useEpisodes } from "../hooks/useEpisodes";
import { useToggleEpisode } from "../hooks/useToggleEpisode";
import { fmtDate } from "../lib/format";
import type { Title } from "../types";

interface Props {
  title: Title;
  onClose: () => void;
}

export function ShowDetail({ title, onClose }: Props) {
  const { data, isLoading, isError, error } = useEpisodes(title.id);
  const toggleEpisode = useToggleEpisode(title.id);

  const bySeason = useMemo(() => {
    if (!data) return [];
    return data.seasons.map((season) => ({
      season,
      episodes: data.episodes.filter((e) => e.season_number === season.season_number),
    }));
  }, [data]);

  const defaultOpenSeason = useMemo(() => {
    const firstUnwatched = bySeason.find((s) => s.episodes.some((e) => !e.watched));
    return firstUnwatched?.season.season_number ?? bySeason[0]?.season.season_number ?? null;
  }, [bySeason]);

  const [openSeason, setOpenSeason] = useState<number | null | "auto">("auto");
  const effectiveOpen = openSeason === "auto" ? defaultOpenSeason : openSeason;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{title.name}</h2>
          <button className="btn-ghost" onClick={onClose}>
            ×
          </button>
        </div>

        {isLoading && <div className="empty">Loading episodes…</div>}
        {isError && <div className="empty">Couldn't load episodes: {(error as Error).message}</div>}

        {!isLoading && !isError && bySeason.length === 0 && (
          <div className="empty">No season data yet for this show.</div>
        )}

        <div className="season-accordion">
          {bySeason.map(({ season, episodes }) => {
            const watchedCount = episodes.filter((e) => e.watched).length;
            const isOpen = effectiveOpen === season.season_number;
            return (
              <div key={season.season_number} className="season-block">
                <button
                  className="season-header"
                  onClick={() => setOpenSeason(isOpen ? null : season.season_number)}
                >
                  <span>{season.name ?? `Season ${season.season_number}`}</span>
                  <span className="season-count">
                    {watchedCount}/{episodes.length}
                  </span>
                </button>

                {isOpen && (
                  <div className="episode-list">
                    {episodes.map((ep) => (
                      <label key={ep.id} className="episode-row">
                        <input
                          type="checkbox"
                          checked={ep.watched}
                          onChange={() => toggleEpisode.mutate(ep)}
                        />
                        <span className="episode-num">E{ep.episode_number}</span>
                        <span className="episode-name">{ep.name ?? "—"}</span>
                        <span className="episode-date">{ep.air_date ? fmtDate(ep.air_date) : ""}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
