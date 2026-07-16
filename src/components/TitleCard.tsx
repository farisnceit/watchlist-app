import { useState } from "react";
import { TYPE_CONFIG, type MediaType, type Status, type Title } from "../types";
import { fmtDate, fmtRuntime } from "../lib/format";
import { useMutateTitle } from "../hooks/useMutateTitle";

interface Props {
  title: Title;
  mediaType: MediaType;
}

export function TitleCard({ title, mediaType }: Props) {
  const [posterFailed, setPosterFailed] = useState(false);
  const { toggleFavourite, changeStatus } = useMutateTitle();
  const config = TYPE_CONFIG[mediaType];

  let left = "";
  let right = "";
  if (mediaType === "movie") {
    left = fmtRuntime(title.runtime_minutes);
    right = title.status === "watched" ? fmtDate(title.watched_at) : fmtDate(title.added_at);
  } else {
    if (title.status === "watched") {
      const total = title.aired_episode_count ? ` / ${title.aired_episode_count}` : "";
      left = `${title.watched_episode_count ?? 0}${total} ep${title.watched_episode_count === 1 ? "" : "s"}`;
    } else if (title.status === "watch_later") {
      left = "saved";
    } else if (title.status === "following") {
      left = title.aired_episode_count
        ? `${title.aired_episode_count} ep${title.aired_episode_count === 1 ? "" : "s"}`
        : "following";
    } else {
      left = "dropped";
    }
    right = title.show_status ?? "";
  }

  const showProgress =
    mediaType === "show" &&
    title.status === "watched" &&
    !!title.aired_episode_count;
  const pct = showProgress
    ? Math.round(((title.watched_episode_count ?? 0) / title.aired_episode_count!) * 100)
    : 0;

  return (
    <div className={`card ${title.status}`}>
      {title.poster_url && !posterFailed ? (
        <img
          className="poster"
          src={title.poster_url}
          alt={title.name}
          loading="lazy"
          onError={() => setPosterFailed(true)}
        />
      ) : (
        <div className="poster placeholder">—</div>
      )}

      <div className="body">
        <div className="name-row">
          <div className="name">
            {title.name}
            {title.year ? ` (${title.year})` : ""}
          </div>
          <button
            className={"fav-btn" + (title.is_favourite ? " active" : "")}
            aria-label={title.is_favourite ? "Remove favourite" : "Mark favourite"}
            onClick={() => toggleFavourite.mutate(title)}
          >
            {title.is_favourite ? "★" : "☆"}
          </button>
        </div>

        <div className="meta">
          <span className="badge">{left}</span>
          <span>{right}</span>
        </div>

        {mediaType === "movie" && title.genres.length > 0 && (
          <div className="genres">{title.genres.slice(0, 3).join(" · ")}</div>
        )}

        {showProgress && (
          <div className="seasons">
            <div className="season-row">
              <span className="bar">
                <span className="bar-fill" style={{ width: `${pct}%` }} />
              </span>
              <span className="s-count">{pct}%</span>
            </div>
          </div>
        )}

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
  );
}
