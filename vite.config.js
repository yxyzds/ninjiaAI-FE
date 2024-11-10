import { defineConfig } from "vite";
import svgLoader from "vite-svg-loader";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), svgLoader()],
});
