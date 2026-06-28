import type { Plugin } from "vite";
import { readdirSync, writeFileSync, mkdirSync, rmSync } from "fs";
import { readFile } from "fs/promises";
import { resolve, relative, dirname, extname } from "path";
import { pathToPageComponentPath } from "../client/router";
import { configToHeadConfig } from "../client/config";
import { headConfigStringify } from "../utils";
import type { FumiConfig } from "../config";
import { Pages, resolvePages } from "../route";

// const EXCLUDE_DIRS = new Set([".fumi", ".git", "dist", "node_modules", "public"]);

// interface PageEntry {
//   url: string;
//   filePath: string;
// }

// function discoverPages(root: string, rewrites?: (path: string) => string): PageEntry[] {
//   const pages: PageEntry[] = [];

//   function walk(dir: string) {
//     for (const entry of readdirSync(dir, { withFileTypes: true })) {
//       if (entry.isDirectory()) {
//         if (!EXCLUDE_DIRS.has(entry.name)) {
//           walk(resolve(dir, entry.name));
//         }
//       } else if (entry.isFile()) {
//         const ext = extname(entry.name);
//         const isUpperCase =
//           entry.name[0] === entry.name[0].toUpperCase() &&
//           entry.name[0] !== entry.name[0].toLowerCase();
//         if ((ext === ".md" || ext === ".vue") && !isUpperCase) {
//           const filePath = resolve(dir, entry.name);
//           const rel = relative(root, filePath).replace(/\\/g, "/");
//           let url = "/" + rel.replace(/\.(md|vue)$/, "");
//           if (url.endsWith("/index")) url = url.slice(0, -6) || "/";
//           if (rewrites) url = rewrites(url);
//           pages.push({ url, filePath });
//         }
//       }
//     }
//   }

//   walk(root);
//   return pages;
// }

function pathToInputKey(path: string): string {
  return "__app" + path.replace(/\.html$/, "");
}

function pathToOutPath(outDir: string, url: string): string {
  return resolve(outDir, url.slice(1));
}

export function build(config: FumiConfig): Plugin {
  let cwd: string;
  let outDir: string;
  let pages: Pages;

  return {
    name: "fumi:build",
    apply: "build",

    async config(vite) {
      cwd = vite.root ?? process.cwd();
      pages = await resolvePages(cwd, config.rewrites);
    },

    configEnvironment(name, config) {
      const input = Object.fromEntries(
        pages.pages.map((p) => [
          pathToInputKey(pages.rewrites.map[p] || p),
          `/${pathToInputKey(p)}.js`,
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
      const { default: root } = await import(resolve(ssrOutDir, "app.js"));

      console.log("\nRendering pages...");
      for (const p of pages.pages) {
        const path = pages.rewrites.map[p] || p;
        const pageComponentPath = resolve(ssrOutDir, `.${pathToPageComponentPath(path)}`);
        const { default: component, __pageData: data } = await import(
          /* @vite-ignore */ pageComponentPath
        );
        const appHtml = await render(root, path, component, data);
        if (appHtml === null) {
          console.log(`  skip ${p.replace(/\.html$/, ".md")}`);
          continue;
        }

        const appHead = headConfigStringify(configToHeadConfig(data));
        const html = template
          .replace("<!--app-html-->", appHtml)
          .replace("<!--app-head-->", appHead);
        const outPath = pathToOutPath(clientOutDir, path);

        mkdirSync(dirname(outPath), { recursive: true });
        writeFileSync(outPath, html);
        console.log(`  ${p.replace(/\.html$/, ".md")} → ${relative(cwd, outPath)}`);
      }

      rmSync(ssrOutDir, { recursive: true });
    },
  };
}
