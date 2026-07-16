import { useMemo, useState } from "react";
import { useTitles } from "./hooks/useTitles";
import { TypeSwitch } from "./components/TypeSwitch";
import { StatusTabs } from "./components/StatusTabs";
import { SearchBox } from "./components/SearchBox";
import { TitleGrid } from "./components/TitleGrid";
import { UpcomingList } from "./components/UpcomingList";
import { AddTitleModal } from "./components/AddTitleModal";
import { TYPE_CONFIG, type MediaType, type Status, type ViewMode } from "./types";

export default function App() {
  const [view, setView] = useState<ViewMode>("movie");
  const [status, setStatus] = useState<Status>(TYPE_CONFIG.movie.tabs[0]);
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const mediaType: MediaType = view === "upcoming" ? "movie" : view;
  const { data: items = [], isLoading, isError, error } = useTitles(mediaType, { enabled: view !== "upcoming" });

  function handleViewChange(next: ViewMode) {
    setView(next);
    if (next !== "upcoming") setStatus(TYPE_CONFIG[next].tabs[0]);
  }

  const filtered = useMemo(() => {
    const byStatus = items.filter((t) => t.status === status);
    if (!query.trim()) return byStatus;
    const q = query.trim().toLowerCase();
    return byStatus.filter((t) => t.name.toLowerCase().includes(q));
  }, [items, status, query]);

  return (
    <>
      <header>
        <p className="eyebrow">// Personal viewing archive</p>
        <h1>Watch Log</h1>
        <p className="sub">
          Movies and shows you've watched, saved for later, or are following.
        </p>

        <div className="header-row">
          <TypeSwitch value={view} onChange={handleViewChange} />
          <button className="btn-primary add-btn" onClick={() => setAddOpen(true)}>
            + Add
          </button>
        </div>

        {view !== "upcoming" && (
          <StatusTabs mediaType={view} items={items} value={status} onChange={setStatus} />
        )}
      </header>

      {view === "upcoming" ? (
        <UpcomingList />
      ) : (
        <>
          <SearchBox value={query} onChange={setQuery} resultCount={filtered.length} totalCount={items.length} />
          {isLoading && <div className="empty">Loading…</div>}
          {isError && <div className="empty">Couldn't load your watchlist: {(error as Error).message}</div>}
          {!isLoading && !isError && <TitleGrid mediaType={view} status={status} items={filtered} />}
        </>
      )}

      <footer>Your personal watchlist, synced via Supabase.</footer>

      {addOpen && (
        <AddTitleModal defaultMediaType={view === "upcoming" ? "movie" : view} onClose={() => setAddOpen(false)} />
      )}
    </>
  );
}
