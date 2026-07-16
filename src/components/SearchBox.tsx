interface Props {
  value: string;
  onChange: (value: string) => void;
  resultCount: number;
  totalCount: number;
}

export function SearchBox({ value, onChange, resultCount, totalCount }: Props) {
  return (
    <div className="toolbar">
      <div className="search">
        <input
          type="text"
          placeholder="Search titles…"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      <span className="sort-lbl">
        {resultCount} of {totalCount} shown
      </span>
    </div>
  );
}
