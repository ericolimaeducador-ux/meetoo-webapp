import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import path from "node:path"

export default defineConfig({
  base: process.env.GITHUB_PAGES === "true" ? "/meetoo-webapp/" : "/",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "src"),
    },
  },
});
