import { useMemo, useState } from "react";
import { useTitles } from "./hooks/useTitles";
import { TypeSwitch } from "./components/TypeSwitch";
import { StatusTabs } from "./components/StatusTabs";
import { SearchBox } from "./components/SearchBox";
import { TitleGrid } from "./components/TitleGrid";
import { AddTitleModal } from "./components/AddTitleModal";
import type { MediaType, Status } from "./types";

export default function App() {
  const [mediaType, setMediaType] = useState<MediaType>("movie");
  const [status, setStatus] = useState<Status>("watched");
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const { data: items = [], isLoading, isError, error } = useTitles(mediaType);

  function handleTypeChange(type: MediaType) {
    setMediaType(type);
    setStatus("watched");
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
          <TypeSwitch value={mediaType} onChange={handleTypeChange} />
          <button className="btn-primary add-btn" onClick={() => setAddOpen(true)}>
            + Add
          </button>
        </div>

        <StatusTabs mediaType={mediaType} items={items} value={status} onChange={setStatus} />
      </header>

      <SearchBox value={query} onChange={setQuery} resultCount={filtered.length} totalCount={items.length} />

      {isLoading && <div className="empty">Loading…</div>}
      {isError && <div className="empty">Couldn't load your watchlist: {(error as Error).message}</div>}
      {!isLoading && !isError && <TitleGrid mediaType={mediaType} status={status} items={filtered} />}

      <footer>Your personal watchlist, synced via Supabase.</footer>

      {addOpen && <AddTitleModal defaultMediaType={mediaType} onClose={() => setAddOpen(false)} />}
    </>
  );
}
