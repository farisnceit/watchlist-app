import { TYPE_CONFIG, type MediaType, type Status, type Title } from "../types";
import { TitleCard } from "./TitleCard";

interface Props {
  mediaType: MediaType;
  status: Status;
  items: Title[];
}

export function TitleGrid({ mediaType, status, items }: Props) {
  const config = TYPE_CONFIG[mediaType];

  return (
    <main>
      <div className="section-title">
        {config.labels[status]} · {items.length}
      </div>

      {items.length === 0 ? (
        <div className="empty">Nothing matches here.</div>
      ) : (
        <div className="grid">
          {items.map((title) => (
            <TitleCard key={title.id} title={title} mediaType={mediaType} />
          ))}
        </div>
      )}
    </main>
  );
}
