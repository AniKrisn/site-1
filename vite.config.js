import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { geminiProxy } from "./vite-plugin-gemini-proxy.ts";
import { salonPlugin } from "./vite-plugin-salon.ts";

export default defineConfig({
  plugins: [react(), geminiProxy(), salonPlugin()],
  base: "/",
});
