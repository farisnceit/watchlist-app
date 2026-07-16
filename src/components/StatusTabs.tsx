import { TYPE_CONFIG, type MediaType, type Status, type Title } from "../types";

interface Props {
  mediaType: MediaType;
  items: Title[];
  value: Status;
  onChange: (status: Status) => void;
}

export function StatusTabs({ mediaType, items, value, onChange }: Props) {
  const config = TYPE_CONFIG[mediaType];

  return (
    <div className={"counter" + (config.tabs.length === 2 ? " cols-2" : "")}>
      {config.tabs.map((tab) => {
        const count = items.filter((t) => t.status === tab).length;
        return (
          <button
            key={tab}
            data-tab={tab}
            className={tab === value ? "active" : ""}
            onClick={() => onChange(tab)}
          >
            <span className="num">{count}</span>
            <span className="lbl">{config.labels[tab]}</span>
          </button>
        );
      })}
    </div>
  );
}
