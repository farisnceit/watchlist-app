import { useEffect, useState } from "react";
import { useTmdbSearch } from "../hooks/useTmdbSearch";
import { useAddTitle } from "../hooks/useAddTitle";
import { TYPE_CONFIG, type MediaType, type Status, type TmdbSearchResult, type TmdbTitleDetails } from "../types";

interface Props {
  defaultMediaType: MediaType;
  onClose: () => void;
}

export function AddTitleModal({ defaultMediaType, onClose }: Props) {
  const [mediaType, setMediaType] = useState<MediaType>(defaultMediaType);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TmdbSearchResult[]>([]);
  const [picked, setPicked] = useState<TmdbTitleDetails | null>(null);
  const [status, setStatus] = useState<Status>("watch_later");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { search, details } = useTmdbSearch();
  const addTitle = useAddTitle();

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(() => {
      search.mutate(
        { mediaType, query: query.trim() },
        { onSuccess: setResults },
      );
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, mediaType]);

  function pickResult(r: TmdbSearchResult) {
    setErrorMsg(null);
    details.mutate(
      { mediaType, tmdbId: r.tmdb_id },
      { onSuccess: (title) => title && setPicked(title) },
    );
  }

  function confirmAdd() {
    if (!picked) return;
    setErrorMsg(null);
    addTitle.mutate(
      { details: picked, status },
      {
        onSuccess: onClose,
        onError: (err) => {
          const message = (err as { code?: string; message?: string }).code === "23505"
            ? "Already in your list."
            : (err as Error).message;
          setErrorMsg(message);
        },
      },
    );
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal add-modal">
        <div className="modal-header">
          <h2 className="modal-title">Add a title</h2>
          <button className="btn-ghost" onClick={onClose}>
            ×
          </button>
        </div>

        {!picked ? (
          <>
            <div className="type-switch">
              <button className={mediaType === "movie" ? "active" : ""} onClick={() => setMediaType("movie")}>
                Movie
              </button>
              <button className={mediaType === "show" ? "active" : ""} onClick={() => setMediaType("show")}>
                Show
              </button>
            </div>

            <input
              autoFocus
              type="text"
              placeholder="Search TMDB…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />

            <div className="tmdb-results">
              {search.isPending && <div className="empty">Searching…</div>}
              {results.map((r) => (
                <button key={r.tmdb_id} className="tmdb-result" onClick={() => pickResult(r)}>
                  {r.poster_url ? (
                    <img src={r.poster_url} alt={r.name} className="poster" />
                  ) : (
                    <div className="poster placeholder">—</div>
                  )}
                  <div>
                    <div className="name">
                      {r.name} {r.year ? `(${r.year})` : ""}
                    </div>
                    {r.overview && <div className="genres">{r.overview.slice(0, 120)}…</div>}
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="tmdb-result picked">
              {picked.poster_url ? (
                <img src={picked.poster_url} alt={picked.name} className="poster" />
              ) : (
                <div className="poster placeholder">—</div>
              )}
              <div className="name">
                {picked.name} {picked.year ? `(${picked.year})` : ""}
              </div>
            </div>

            <label className="field-label">
              Add to
              <select value={status} onChange={(e) => setStatus(e.target.value as Status)}>
                {TYPE_CONFIG[mediaType].tabs.map((tab) => (
                  <option key={tab} value={tab}>
                    {TYPE_CONFIG[mediaType].labels[tab]}
                  </option>
                ))}
              </select>
            </label>

            {errorMsg && <p className="modal-error">{errorMsg}</p>}

            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setPicked(null)}>
                Back
              </button>
              <button className="btn-primary" onClick={confirmAdd} disabled={addTitle.isPending}>
                {addTitle.isPending ? "Adding…" : "Add"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
