import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve, relative, dirname } from "node:path";
import type { Plugin } from "vite";
import { pathToPageComponentPath } from "../client/router";
import { configToHeadConfig } from "../client/config";
import { headConfigStringify } from "../utils";
import type { FumiConfig } from "../config";
import { collectPages, rewritePath } from "../route";
import { pathToFileURL } from "node:url";

export function build(config: FumiConfig): Plugin {
  const rewrite = rewritePath.bind(null, config.rewrites);
  let cwd: string;
  let outDir: string;
  let pages: string[];

  return {
    name: "fumi:build",
    apply: "build",

    async config(vite) {
      cwd = vite.root ?? process.cwd();
      pages = await collectPages(cwd);
    },

    configEnvironment(name, config) {
      const input = Object.fromEntries(
        pages.map((p) => [
          pathToPageComponentPath(rewrite(p)).slice(1, -3),
          pathToPageComponentPath(p),
        ]),
      );

      if (name === "client") {
        return {
          build: {
            rolldownOptions: {
              preserveEntrySignatures: "strict",
              input: {
                index: resolve(cwd, ".fumi/index.html"),
                ...input,
              },
              output: {
                entryFileNames: (chunk) => {
                  if (chunk.name.startsWith("__app/")) return chunk.name + ".js";
                  return "assets/[name]-[hash].js";
                },
                chunkFileNames: "assets/[name]-[hash].js",
                assetFileNames: "assets/[name]-[hash].[ext]",
              },
            },
          },
        };
      }
      if (name === "ssr") {
        return {
          build: {
            outDir: `${config.build?.outDir ?? "dist"}/.fumi`,
            emptyOutDir: false,
            rolldownOptions: {
              input: {
                app: ".fumi/App.vue",
                ...input,
              },
              output: {
                entryFileNames: (chunk) => {
                  if (chunk.name.startsWith("__app/")) return chunk.name + ".js";
                  return "[name].js";
                },
                chunkFileNames: "assets/[name]-[hash].js",
                assetFileNames: "assets/[name]-[hash][ext]",
              },
            },
          },
        };
      }
    },

    configResolved(config) {
      outDir = config.build.outDir;
    },

    async closeBundle() {
      if (this.environment?.name !== "ssr") return;

      // configResolved が SSR 環境で呼ばれるため outDir は "dist/.fumi"
      const ssrOutDir = outDir;
      const clientOutDir = resolve(ssrOutDir, "..");

      const templatePath = resolve(ssrOutDir, "index.html");
      const template = await readFile(templatePath, "utf-8");

      const { render } = await import("#ssr");
      const { default: root } = await import(pathToFileURL(resolve(ssrOutDir, "app.js")).href);

      console.log("\nRendering pages...");
      for (const p of pages) {
        const path = rewrite(p);
        const mdPath = path.replace(/\.html$/, ".md");

        const { default: component, __pageData: data } = await import(
          /* @vite-ignore */ pathToFileURL(
            resolve(ssrOutDir, pathToPageComponentPath(path).slice(1)),
          ).href
        );
        const appHtml = await render(root, path, component, data);
        if (appHtml === null) {
          console.log(`  skip ${mdPath}`);
          continue;
        }
        const appHead = headConfigStringify(configToHeadConfig(data));
        const html = template
          .replace("<!--app-html-->", appHtml)
          .replace("<!--app-head-->", appHead);

        const outPath = resolve(clientOutDir, path.slice(1));
        mkdirSync(dirname(outPath), { recursive: true });
        writeFileSync(outPath, html);

        console.log(`  ${mdPath} → ${relative(cwd, outPath)}`);
      }

      rmSync(ssrOutDir, { recursive: true });
    },
  };
}
