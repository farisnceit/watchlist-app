export function fmtDate(s: string | null): string {
  if (!s) return "—";
  return s.slice(0, 10);
}

export function fmtRuntime(minutes: number | null): string {
  if (!minutes) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}
