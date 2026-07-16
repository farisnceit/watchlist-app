import type { ViewMode } from "../types";

interface Props {
  value: ViewMode;
  onChange: (view: ViewMode) => void;
}

export function TypeSwitch({ value, onChange }: Props) {
  return (
    <div className="type-switch">
      <button className={value === "movie" ? "active" : ""} onClick={() => onChange("movie")}>
        Movies
      </button>
      <button className={value === "show" ? "active" : ""} onClick={() => onChange("show")}>
        Shows
      </button>
      <button className={value === "upcoming" ? "active" : ""} onClick={() => onChange("upcoming")}>
        Upcoming
      </button>
    </div>
  );
}
