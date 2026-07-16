import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import App from "./App.tsx";
import { AccessCodeProvider } from "./context/AccessCodeContext";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AccessCodeProvider>
        <App />
      </AccessCodeProvider>
    </QueryClientProvider>
  </StrictMode>,
);
