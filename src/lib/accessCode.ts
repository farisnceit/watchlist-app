const STORAGE_KEY = "watchlist_access_code";

export function getAccessCode(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

export function setAccessCode(code: string): void {
  localStorage.setItem(STORAGE_KEY, code);
}

export function clearAccessCode(): void {
  localStorage.removeItem(STORAGE_KEY);
}
