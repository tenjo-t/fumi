import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  root: "src/editor",
  base: "/__fumi/editor/",
  build: { outDir: "../../dist/editor" },
  plugins: [vue(), tailwindcss()],
});
