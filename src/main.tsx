import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import App from "./App.tsx";
import { DiscoverPage } from "./components/DiscoverPage";
import { AccessCodeProvider } from "./context/AccessCodeContext";

const queryClient = new QueryClient();

/** Minimal path-based switch — see lib/router.ts. Only "/discover" is a
 * real separate page; everything else stays inside App's tab state. */
function Root() {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);
  return path === "/discover" ? <DiscoverPage /> : <App />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AccessCodeProvider>
        <Root />
      </AccessCodeProvider>
    </QueryClientProvider>
  </StrictMode>,
);
