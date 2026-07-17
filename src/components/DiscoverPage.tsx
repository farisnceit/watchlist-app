import { useRef, useState, type PointerEvent } from "react";
import { useSwipeCandidates } from "../hooks/useSwipeCandidates";
import { useSwipeActions } from "../hooks/useSwipeActions";
import { navigate } from "../lib/router";
import type { SwipeCandidate } from "../types";

const SWIPE_THRESHOLD = 100;

export function DiscoverPage() {
  const { queue, loading, error, advance } = useSwipeCandidates();
  const { like, skip } = useSwipeActions();
  const [dragX, setDragX] = useState(0);
  const draggingRef = useRef(false);
  const startXRef = useRef(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const current = queue[0];
  const visible = queue.slice(0, 3);

  function commit(candidate: SwipeCandidate, liked: boolean) {
    advance(candidate.tmdb_id);
    setDragX(0);
    if (liked) {
      like.mutate(candidate, {
        onError: (err) => setErrorMsg(`Couldn't add "${candidate.name}": ${(err as Error).message}`),
      });
    } else {
      skip.mutate(candidate, {
        onError: (err) => setErrorMsg(`Couldn't skip "${candidate.name}": ${(err as Error).message}`),
      });
    }
  }

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (!current) return;
    draggingRef.current = true;
    startXRef.current = e.clientX;
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;
    setDragX(e.clientX - startXRef.current);
  }

  function endDrag() {
    if (!draggingRef.current || !current) return;
    draggingRef.current = false;
    if (dragX > SWIPE_THRESHOLD) commit(current, true);
    else if (dragX < -SWIPE_THRESHOLD) commit(current, false);
    else setDragX(0);
  }

  return (
    <>
      <header>
        <div className="header-row">
          <button className="btn-ghost" onClick={() => navigate("/")}>
            ← Back
          </button>
        </div>
        <p className="eyebrow">// Discover</p>
        <h1>Swipe</h1>
        <p className="sub">Popular movies from TMDB. Heart to save, cross to skip for good.</p>
      </header>

      <main className="discover-main">
        {errorMsg && <p className="modal-error">{errorMsg}</p>}

        <div className="swipe-stack">
          {loading && queue.length === 0 && <div className="empty">Loading movies…</div>}
          {error && queue.length === 0 && (
            <div className="empty">Couldn't load movies: {error.message}</div>
          )}
          {!loading && !error && queue.length === 0 && (
            <div className="empty">No more movies right now — check back later.</div>
          )}

          {[...visible].reverse().map((c, idx) => {
            const isTop = idx === visible.length - 1;
            return (
              <div
                key={c.tmdb_id}
                className={`swipe-card${isTop ? " top" : ""}`}
                style={isTop ? { transform: `translateX(${dragX}px) rotate(${dragX / 20}deg)` } : undefined}
                onPointerDown={isTop ? onPointerDown : undefined}
                onPointerMove={isTop ? onPointerMove : undefined}
                onPointerUp={isTop ? endDrag : undefined}
                onPointerCancel={isTop ? endDrag : undefined}
              >
                {c.poster_url ? (
                  <img className="swipe-poster" src={c.poster_url} alt={c.name} draggable={false} />
                ) : (
                  <div className="swipe-poster placeholder">—</div>
                )}
                <div className="swipe-info">
                  <div className="swipe-name">
                    {c.name} {c.year ? `(${c.year})` : ""}
                  </div>
                  {c.vote_average != null && <span className="badge">★ {c.vote_average.toFixed(1)}</span>}
                  {c.overview && <p className="swipe-overview">{c.overview}</p>}
                </div>
                {isTop && dragX > 40 && <div className="swipe-stamp like">ADD</div>}
                {isTop && dragX < -40 && <div className="swipe-stamp skip">SKIP</div>}
              </div>
            );
          })}
        </div>

        <div className="swipe-actions">
          <button className="swipe-btn cross" onClick={() => current && commit(current, false)} disabled={!current} aria-label="Skip">
            ✕
          </button>
          <button className="swipe-btn heart" onClick={() => current && commit(current, true)} disabled={!current} aria-label="Add to watchlist">
            ♥
          </button>
        </div>
      </main>

      <footer>Your personal watchlist, synced via Supabase.</footer>
    </>
  );
}
