/** Minimal client-side "router" — this app is small enough that a real
 * router library would be overkill. Just enough to give Discover its own
 * URL (so it's linkable/refreshable) alongside the existing tab-based views. */
export function navigate(path: string): void {
  if (window.location.pathname !== path) {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }
}
