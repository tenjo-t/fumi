import { defineConfig } from "tsdown";
import vue from "unplugin-vue/rolldown";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    main: "src/client/main.ts",
    client: "src/client/index.ts",
    ssr: "src/ssr.ts",
  },
  format: "esm",
  plugins: [vue({ isProduction: true })],
  dts: { vue: true },
  deps: {
    neverBundle: ["vue", "vite", "@vitejs/plugin-vue", "@app"],
  },
});
