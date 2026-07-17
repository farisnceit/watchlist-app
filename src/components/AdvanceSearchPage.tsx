import { useMemo, useState } from "react";
import { useAdvanceSearch, type SearchFilters } from "../hooks/useAdvanceSearch";
import { useTitles } from "../hooks/useTitles";
import { useTmdbSearch } from "../hooks/useTmdbSearch";
import { useAddTitle } from "../hooks/useAddTitle";
import { navigate } from "../lib/router";
import { MOVIE_GENRES } from "../lib/genres";
import type { SwipeCandidate } from "../types";

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "popularity.desc", label: "Popularity" },
  { value: "vote_average.desc", label: "Rating" },
  { value: "primary_release_date.desc", label: "Newest" },
];

const RATING_OPTIONS = [0, 5, 6, 7, 8, 9];

export function AdvanceSearchPage() {
  const [genreIds, setGenreIds] = useState<number[]>([]);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState(SORT_OPTIONS[0].value);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const filters: SearchFilters = { genreIds, minRating, sortBy };
  const { results, loading, error, loadMore, hasMore } = useAdvanceSearch(filters);

  const { data: ownMovies = [] } = useTitles("movie");
  const ownTmdbIds = useMemo(() => new Set(ownMovies.map((t) => t.tmdb_id).filter((id): id is number => id != null)), [ownMovies]);

  const { details } = useTmdbSearch();
  const addTitle = useAddTitle();

  function toggleGenre(id: number) {
    setGenreIds((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]));
  }

  function handleAdd(candidate: SwipeCandidate) {
    setErrorMsg(null);
    setAddingId(candidate.tmdb_id);
    details.mutate(
      { mediaType: "movie", tmdbId: candidate.tmdb_id },
      {
        onSuccess: (title) => {
          if (!title) {
            setAddingId(null);
            return;
          }
          addTitle.mutate(
            { details: title, status: "watch_later" },
            {
              onSettled: () => setAddingId(null),
              onError: (err) => setErrorMsg(`Couldn't add "${candidate.name}": ${(err as Error).message}`),
            },
          );
        },
        onError: (err) => {
          setAddingId(null);
          setErrorMsg(`Couldn't add "${candidate.name}": ${(err as Error).message}`);
        },
      },
    );
  }

  return (
    <>
      <header>
        <div className="header-row">
          <button className="btn-ghost" onClick={() => navigate("/")}>
            ← Back
          </button>
        </div>
        <p className="eyebrow">// Advance search</p>
        <h1>Search</h1>
        <p className="sub">Browse TMDB by genre and rating — add anything straight to Watch later.</p>
      </header>

      <main>
        <div className="filters">
          <div className="genre-pills">
            {MOVIE_GENRES.map((g) => (
              <button
                key={g.id}
                className={`genre-pill${genreIds.includes(g.id) ? " active" : ""}`}
                onClick={() => toggleGenre(g.id)}
              >
                {g.name}
              </button>
            ))}
          </div>

          <div className="filter-row">
            <label className="field-label">
              Min rating
              <select value={minRating} onChange={(e) => setMinRating(Number(e.target.value))}>
                {RATING_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r === 0 ? "Any" : `${r}+`}
                  </option>
                ))}
              </select>
            </label>

            <label className="field-label">
              Sort by
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                {SORT_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {errorMsg && <p className="modal-error">{errorMsg}</p>}
        {error && <div className="empty">Couldn't load results: {error.message}</div>}

        <div className="search-grid">
          {results.map((c) => {
            const owned = ownTmdbIds.has(c.tmdb_id);
            const isAdding = addingId === c.tmdb_id;
            return (
              <div key={c.tmdb_id} className="search-card">
                {c.poster_url ? (
                  <img className="poster" src={c.poster_url} alt={c.name} loading="lazy" />
                ) : (
                  <div className="poster placeholder">—</div>
                )}
                <div className="search-card-body">
                  <div className="name">
                    {c.name} {c.year ? `(${c.year})` : ""}
                  </div>
                  {c.vote_average != null && <span className="badge">★ {c.vote_average.toFixed(1)}</span>}
                </div>
                <button
                  className={owned ? "btn-ghost search-add owned" : "btn-primary search-add"}
                  disabled={owned || isAdding}
                  onClick={() => handleAdd(c)}
                >
                  {owned ? "In list" : isAdding ? "Adding…" : "+ Add"}
                </button>
              </div>
            );
          })}
        </div>

        {loading && results.length === 0 && <div className="empty">Searching…</div>}
        {!loading && results.length === 0 && !error && <div className="empty">No movies match those filters.</div>}

        {hasMore && (
          <div className="load-more-row">
            <button className="btn-ghost" onClick={loadMore} disabled={loading}>
              {loading ? "Loading…" : "Load more"}
            </button>
          </div>
        )}
      </main>

      <footer>Your personal watchlist, synced via Supabase.</footer>
    </>
  );
}
