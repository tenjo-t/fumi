import { defineConfig } from "@tenjot/fumi";
import editor from "@tenjot/fumi-plugin-editor";
import tailwindcss from "@tailwindcss/vite";
import remarkShikiHighlight from "@tenjot/remark-shiki-highlight";

export default defineConfig({
  title: "Fumi",
  titleTemplate: ":title | Fumi",
  description: "A static site generator for Vue + remark",
  vite: {
    plugins: [editor(), tailwindcss()],
  },
  markdown: {
    remarkPlugins: [[remarkShikiHighlight, { theme: "catppuccin-mocha" }]],
  },
});
