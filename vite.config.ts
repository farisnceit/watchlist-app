import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      // Precache only the built app-shell assets. Do NOT runtime-cache
      // Supabase REST/Edge Function responses — the app should always show
      // live data, and simply fail to load data (not stale-serve it) when
      // offline. Default generateSW behavior already only precaches the
      // build output, so no extra runtimeCaching config is added here.
      manifest: {
        name: "Watchlist",
        short_name: "Watchlist",
        description: "Personal movie & show watchlist",
        theme_color: "#0F1A19",
        background_color: "#0F1A19",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "/icons/icon-512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
});
