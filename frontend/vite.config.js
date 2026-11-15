import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@/registry/new-york-v4/ui": path.resolve(__dirname, "./src/components/ui"),
      "@shadcn/react/message-scroller": path.resolve(__dirname, "./src/packages/message-scroller/index.ts"),
      "next/link": path.resolve(__dirname, "./src/lib/next-link-shim.tsx"),
      "next/navigation": path.resolve(__dirname, "./src/lib/next-nav-shim.ts"),
      "next-themes": path.resolve(__dirname, "./src/lib/next-themes-shim.ts"),
      "@": path.resolve(__dirname, "./src"),
      cn: path.resolve(__dirname, "./src/lib/utils.ts"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:8000",
      "/assets": "http://localhost:8000",
      "/sessions": "http://localhost:8000",
    },
  },
  build: {
    emptyOutDir: true,
  },
});
