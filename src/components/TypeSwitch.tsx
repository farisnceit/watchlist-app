import type { MediaType } from "../types";

interface Props {
  value: MediaType;
  onChange: (type: MediaType) => void;
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
    </div>
  );
}
