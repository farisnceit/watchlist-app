import { useState, type FormEvent } from "react";

interface Props {
  onSubmit: (code: string) => void;
  onCancel: () => void;
}

export function AccessCodePrompt({ onSubmit, onCancel }: Props) {
  const [value, setValue] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (value.trim()) onSubmit(value.trim());
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <form className="modal" onSubmit={handleSubmit}>
        <h2 className="modal-title">Access code required</h2>
        <p className="modal-sub">
          Editing this watchlist needs the access code. It's saved on this
          device after you enter it once.
        </p>
        <input
          type="password"
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Access code"
        />
        <div className="modal-actions">
          <button type="button" className="btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={!value.trim()}>
            Continue
          </button>
        </div>
      </form>
    </div>
  );
}
