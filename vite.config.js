import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { geminiProxy } from "./vite-plugin-gemini-proxy.ts";

export default defineConfig({
  plugins: [react(), geminiProxy()],
  base: "/",
});
