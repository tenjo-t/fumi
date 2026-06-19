import type { Plugin } from "vite";
import { readdirSync, writeFileSync, mkdirSync, rmSync } from "fs";
import { readFile } from "fs/promises";
import { resolve, relative, dirname, extname } from "path";
import { pathToPageComponentPath } from "../client/router";
import { configToHeadConfig } from "../client/config";
import { headConfigStringify } from "../utils";

const EXCLUDE_DIRS = new Set([".fumi", ".git", "dist", "node_modules", "packages", "public"]);

interface PageEntry {
  url: string;
  filePath: string;
}

function discoverPages(root: string): PageEntry[] {
  const pages: PageEntry[] = [];

  function walk(dir: string) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!EXCLUDE_DIRS.has(entry.name)) {
          walk(resolve(dir, entry.name));
        }
      } else if (entry.isFile()) {
        const ext = extname(entry.name);
        const isUpperCase =
          entry.name[0] === entry.name[0].toUpperCase() &&
          entry.name[0] !== entry.name[0].toLowerCase();
        if ((ext === ".md" || ext === ".vue") && !isUpperCase) {
          const filePath = resolve(dir, entry.name);
          const rel = relative(root, filePath).replace(/\\/g, "/");
          let url = "/" + rel.replace(/\.(md|vue)$/, "");
          if (url.endsWith("/index")) url = url.slice(0, -6) || "/";
          pages.push({ url, filePath });
        }
      }
    }
  }

  walk(root);
  return pages;
}

function urlToInputKey(url: string): string {
  return url === "/" ? "__app/index" : `__app${url}`;
}

function urlToOutPath(outDir: string, url: string): string {
  if (url === "/") return resolve(outDir, "index.html");
  return resolve(outDir, url.slice(1) + ".html");
}

export function build(): Plugin {
  let outDir: string;

  return {
    name: "fumi:build",
    apply: "build",

    configEnvironment(name, config) {
      const cwd = process.cwd();
      const pages = discoverPages(cwd);
      if (name === "client") {
        return {
          build: {
            rolldownOptions: {
              preserveEntrySignatures: "strict",
              input: {
                index: resolve(cwd, ".fumi/index.html"),
                ...Object.fromEntries(
                  pages.map(({ url }) => [urlToInputKey(url), `/${urlToInputKey(url)}.js`]),
                ),
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
        const outDir = config.build?.outDir ?? "dist";

        return {
          build: {
            outDir: `${outDir}/.fumi`,
            emptyOutDir: false,
            rolldownOptions: {
              input: {
                app: ".fumi/App.vue",
                ...Object.fromEntries(
                  pages.map(({ url }) => [urlToInputKey(url), `/${urlToInputKey(url)}.js`]),
                ),
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

      const cwd = process.cwd();
      const pages = discoverPages(cwd);
      // configResolved が SSR 環境で呼ばれるため outDir は "dist/.fumi"
      const ssrOutDir = outDir;
      const clientOutDir = resolve(ssrOutDir, "..");

      const templatePath = resolve(ssrOutDir, "index.html");
      const template = await readFile(templatePath, "utf-8");

      const { render } = await import("#ssr");
      const { default: root } = await import(resolve(ssrOutDir, "app.js"));

      console.log("\nRendering pages...");
      for (const { url } of pages) {
        const pageComponentPath = resolve(ssrOutDir, `.${pathToPageComponentPath(url)}`);
        const { default: component, __pageData: data } = await import(
          /* @vite-ignore */ pageComponentPath
        );
        const appHtml = await render(root, url, component, data);
        if (appHtml === null) {
          console.log(`  skip ${url}`);
          continue;
        }

        const appHead = headConfigStringify(configToHeadConfig(data));
        const html = template
          .replace("<!--app-html-->", appHtml)
          .replace("<!--app-head-->", appHead);
        const outPath = urlToOutPath(clientOutDir, url);

        mkdirSync(dirname(outPath), { recursive: true });
        writeFileSync(outPath, html);
        console.log(`  ${url} → ${relative(cwd, outPath)}`);
      }

      rmSync(ssrOutDir, { recursive: true });
    },
  };
}
