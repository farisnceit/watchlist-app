import { useMemo, useState } from "react";
import { TYPE_CONFIG, type MediaType, type Status, type Title } from "../types";
import { fmtDate, fmtRuntime } from "../lib/format";
import { useMutateTitle } from "../hooks/useMutateTitle";
import { useEpisodes } from "../hooks/useEpisodes";
import { useToggleEpisode } from "../hooks/useToggleEpisode";

interface Props {
  title: Title;
  mediaType: MediaType;
  onClose: () => void;
}

export function TitleDetail({ title, mediaType, onClose }: Props) {
  const isShow = mediaType === "show";
  const config = TYPE_CONFIG[mediaType];
  const { toggleFavourite, changeStatus } = useMutateTitle();

  const { data, isLoading, isError, error } = useEpisodes(title.id, { enabled: isShow });
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

  const totalEpisodes = data?.episodes.length ?? 0;
  const watchedEpisodes = data?.episodes.filter((e) => e.watched).length ?? 0;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div className="modal detail-modal" onClick={(e) => e.stopPropagation()}>
        <button className="detail-close" aria-label="Close" onClick={onClose}>
          ×
        </button>

        <div className="detail-header">
          {title.poster_url ? (
            <img className="detail-poster" src={title.poster_url} alt={title.name} />
          ) : (
            <div className="detail-poster placeholder">—</div>
          )}

          <div className="detail-info">
            <div className="detail-name-row">
              <h2 className="detail-name">
                {title.name}
                {title.year ? ` (${title.year})` : ""}
              </h2>
              <button
                className={"fav-btn" + (title.is_favourite ? " active" : "")}
                aria-label={title.is_favourite ? "Remove favourite" : "Mark favourite"}
                onClick={() => toggleFavourite.mutate(title)}
              >
                {title.is_favourite ? "★" : "☆"}
              </button>
            </div>

            <div className="detail-badges">
              {isShow ? (
                <>
                  {title.show_status && <span className="badge">{title.show_status}</span>}
                  {isShow && totalEpisodes > 0 && (
                    <span className="badge">
                      {watchedEpisodes}/{totalEpisodes} ep watched
                    </span>
                  )}
                  {title.next_episode_air_date && (
                    <span className="badge">
                      Next: S{title.next_episode_season}E{title.next_episode_number} ·{" "}
                      {fmtDate(title.next_episode_air_date)}
                    </span>
                  )}
                </>
              ) : (
                <>
                  {title.runtime_minutes && <span className="badge">{fmtRuntime(title.runtime_minutes)}</span>}
                  {title.watched_at && <span className="badge">Watched {fmtDate(title.watched_at)}</span>}
                </>
              )}
            </div>

            {title.genres.length > 0 && <div className="detail-genres">{title.genres.join(" · ")}</div>}

            <select
              className="status-select"
              value={title.status}
              onChange={(e) => changeStatus.mutate({ title, status: e.target.value as Status })}
            >
              {config.tabs.map((tab) => (
                <option key={tab} value={tab}>
                  {config.labels[tab]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {title.overview && <p className="detail-overview">{title.overview}</p>}

        {isShow && (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}
