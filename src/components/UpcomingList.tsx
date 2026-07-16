import { useUpcoming } from "../hooks/useUpcoming";
import { fmtCountdown } from "../lib/format";

export function UpcomingList() {
  const { data: items = [], isLoading, isError, error } = useUpcoming();

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
        <div className="empty">
          Nothing with a known release date yet. Movies in Watch later and shows you're
          following will show up here once TMDB has a date.
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="section-title">Upcoming · {items.length}</div>
      <div className="grid">
        {items.map(({ title, date, episodeLabel }) => (
          <div key={title.id} className={`card upcoming ${title.media_type}`}>
            {title.poster_url ? (
              <img className="poster" src={title.poster_url} alt={title.name} loading="lazy" />
            ) : (
              <div className="poster placeholder">—</div>
            )}
            <div className="body">
              <div className="name-row">
                <div className="name">
                  {title.name}
                  {title.year ? ` (${title.year})` : ""}
                </div>
              </div>
              <div className="meta">
                <span className={`badge media-badge ${title.media_type}`}>
                  {title.media_type === "movie" ? "Movie" : `Show · ${episodeLabel ?? "New ep"}`}
                </span>
                <span className="countdown">{fmtCountdown(date)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
