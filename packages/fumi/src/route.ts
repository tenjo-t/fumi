import { resolve } from "node:path";
import { glob } from "tinyglobby";
import type { ViteDevServer } from "vite";
import type { FumiConfig } from "./config";

interface Rewrites {
  map: Record<string, string>;
  inv: Record<string, string>;
}

export interface Pages {
  pages: string[];
  rewrites: Rewrites;
}

const SRC_EXCLUDE = new Set([".fumi", ".git", "node_modules"]);

function resolveRewrite(pages: string[], rewritesFn: FumiConfig["rewrites"]): Rewrites {
  const fileToRewrite: Record<string, string> = {};
  const rewriteTofile: Record<string, string> = {};

  if (rewritesFn) {
    for (const page of pages) {
      const dest = rewritesFn(page);
      if (dest && dest !== page) {
        fileToRewrite[page] = dest;
        rewriteTofile[dest] = page;
      }
    }
  }

  return {
    map: fileToRewrite,
    inv: rewriteTofile,
  };
}

export async function resolvePages(root: string, rewritesFn: FumiConfig["rewrites"]) {
  const pages = (
    await glob("**/*.md", {
      cwd: root,
      ignore: [...SRC_EXCLUDE],
    })
  ).map((p) => "/" + p.replaceAll("\\", "/").replace(/\.md$/, ".html"));

  const rewrites = resolveRewrite(pages, rewritesFn);

  return { pages, rewrites };
}

export async function rewritesDevServer(server: ViteDevServer, rewritesFn: FumiConfig["rewrites"]) {
  const config = server.config;

  let { rewrites } = await resolvePages(config.root, rewritesFn);

  server.middlewares.use((req, _, next) => {
    if (!req.url || req.method !== "GET") {
      return next();
    }

    let page = decodeURI(req.url).replace(/[?#].*$/, "");
    if (page.startsWith("/__app/")) {
      page = page.slice(6, -3);
    } else {
      if (!req.headers.accept?.includes("text/html")) {
        return next();
      }
      const ext = page.slice(page.lastIndexOf("/") + 1).match(/\.[^.]+$/)?.[0];
      if (ext === ".html") {
        page = page.slice(0, -5);
      } else if (ext != null) {
        return next();
      }
    }

    const rewrite = rewrites.inv[`${page}.html`]?.slice(0, -5);
    if (rewrite) {
      req.url = req.url.replace(encodeURI(page), encodeURI(rewrite));
      req.originalUrl = req.originalUrl?.replace(encodeURI(page), encodeURI(rewrite));
    }
    next();
  });

  const update = async (p: string) => {
    if (!p.endsWith(".md")) return;
    rewrites = (await resolvePages(config.root, rewritesFn)).rewrites;
  };

  server.watcher.add(resolve(config.root, "**/*.md")).on("add", update).on("unlink", update);
}
