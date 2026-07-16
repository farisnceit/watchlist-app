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

/** "Today" / "Tomorrow" / "In 5 days" / the date itself once it's far off. */
export function fmtCountdown(dateStr: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  const days = Math.round((target.getTime() - today.getTime()) / 86_400_000);

  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days > 1 && days <= 21) return `In ${days} days`;
  return dateStr;
}
