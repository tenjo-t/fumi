import { resolve, normalize, extname } from "node:path";
import { glob } from "tinyglobby";
import type { ViteDevServer } from "vite";
import type { FumiConfig } from "./config";

const postfixRE = /[?#].*$/;
const SRC_EXCLUDE = new Set([".fumi", ".git", "node_modules"]);

export function cleanUrl(url: string) {
  return url.replace(postfixRE, "");
}

export function fileToUrl(path: string, root?: string) {
  let urlpath = normalize(path).replaceAll("\\", "/").replace(/\.md$/, ".html");
  if (root) urlpath = urlpath.replace(root, "");
  if (urlpath[0] !== "/") urlpath = "/" + urlpath;
  return urlpath;
}

export function rewritePath(rewrite: FumiConfig["rewrites"], path: string) {
  return rewrite?.(path) ?? path;
}

export async function collectPages(root: string) {
  const md = await glob("**/*.md", {
    cwd: root,
    ignore: [...SRC_EXCLUDE],
  });
  return md.map((p) => fileToUrl(p));
}

async function rewritesMap(root: string, rewritesFn: FumiConfig["rewrites"]) {
  const pages = await collectPages(root);

  const rewriteTofile: Record<string, string> = {};

  if (rewritesFn) {
    for (const page of pages) {
      const dest = rewritesFn(page);
      if (dest && dest !== page) {
        rewriteTofile[dest.slice(0, -5)] = page.slice(0, -5);
      }
    }
  }

  return rewriteTofile;
}

export async function rewritesDevServer(server: ViteDevServer, rewritesFn: FumiConfig["rewrites"]) {
  const config = server.config;

  let rewrites = await rewritesMap(config.root, rewritesFn);

  server.middlewares.use((req, _, next) => {
    if (!req.url || req.method !== "GET") {
      return next();
    }

    let page = cleanUrl(decodeURI(req.url));
    if (page.startsWith("/__app/")) {
      page = page.slice(6, -3);
    } else {
      if (!req.headers.accept?.includes("text/html")) {
        return next();
      }
      const ext = extname(page);
      if (ext === ".html") {
        page = page.slice(0, -5);
      } else if (ext !== "") {
        return next();
      }
    }

    const rewrite = rewrites[page];
    if (rewrite) {
      req.url = req.url.replace(encodeURI(page), encodeURI(rewrite));
      req.originalUrl = req.originalUrl?.replace(encodeURI(page), encodeURI(rewrite));
    }
    next();
  });

  const update = async (p: string) => {
    if (!p.endsWith(".md")) return;
    rewrites = await rewritesMap(config.root, rewritesFn);
  };

  server.watcher.add(resolve(config.root, "**/*.md")).on("add", update).on("unlink", update);
}
