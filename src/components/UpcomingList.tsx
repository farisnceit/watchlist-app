import { useState } from "react";
import { useUpcoming } from "../hooks/useUpcoming";
import { fmtCountdown } from "../lib/format";
import { TitleDetail } from "./TitleDetail";
import type { Title } from "../types";

export function UpcomingList() {
  const { data: items = [], isLoading, isError, error } = useUpcoming();
  const [openTitle, setOpenTitle] = useState<Title | null>(null);

  if (isLoading) return <main><div className="empty">Loading…</div></main>;
  if (isError) {
    return (
      <main>
        <div className="empty">Couldn't load upcoming releases: {(error as Error).message}</div>
      </main>
    );
  }
  if (items.length === 0) {
    return (
      <main>
        <div className="section-title">Upcoming · Next 30 days</div>
        <div className="empty">
          Nothing with a known release date in the next 30 days. Movies in Watch later and
          shows you're following will show up here once TMDB has a date.
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="section-title">Upcoming · Next 30 days · {items.length}</div>
      <div className="grid">
        {items.map((item) => {
          const inList = !!item.title;
          return (
            <div
              key={item.key}
              className={`card upcoming ${item.media_type}${inList ? " clickable" : ""}`}
              role={inList ? "button" : undefined}
              tabIndex={inList ? 0 : undefined}
              onClick={inList ? () => setOpenTitle(item.title) : undefined}
              onKeyDown={
                inList
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") setOpenTitle(item.title);
                    }
                  : undefined
              }
            >
              {item.poster_url ? (
                <img className="poster" src={item.poster_url} alt={item.name} loading="lazy" />
              ) : (
                <div className="poster placeholder">—</div>
              )}
              <div className="body">
                <span className={`type-label ${item.media_type}`}>
                  {item.media_type}
                  {!inList && " · discover"}
                </span>
                <div className="name-row">
                  <div className="name">
                    {item.name}
                    {item.year ? ` (${item.year})` : ""}
                  </div>
                </div>
                <div className="meta">
                  {item.episodeLabel && <span className="badge">{item.episodeLabel}</span>}
                  <span className="countdown">{fmtCountdown(item.date)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {openTitle && (
        <TitleDetail title={openTitle} mediaType={openTitle.media_type} onClose={() => setOpenTitle(null)} />
      )}
    </main>
  );
}
