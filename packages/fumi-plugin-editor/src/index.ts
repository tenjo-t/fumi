import type { Plugin } from "vite";
import type { IncomingMessage } from "http";
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from "fs";
import { resolve, relative, extname, dirname } from "path";
import { fileURLToPath } from "url";

const EXCLUDE_DIRS = new Set([
  ".fumi",
  ".vitepress",
  "node_modules",
  "dist",
  ".git",
  "packages",
  "script",
  "public",
]);

function discoverMarkdownFiles(root: string): string[] {
  const files: string[] = [];
  function walk(dir: string) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!EXCLUDE_DIRS.has(entry.name)) walk(resolve(dir, entry.name));
      } else if (entry.isFile() && extname(entry.name) === ".md") {
        const isUpper =
          entry.name[0] === entry.name[0].toUpperCase() &&
          entry.name[0] !== entry.name[0].toLowerCase();
        if (!isUpper) files.push(resolve(dir, entry.name));
      }
    }
  }
  walk(root);
  return files;
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

export default function editor(): Plugin {
  let root: string;

  return {
    name: "fumi:editor",
    apply: "serve",

    configResolved(config) {
      root = config.root;
    },

    async configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.originalUrl ?? req.url ?? "/";
        const pathname = url.split("?")[0];
        if (pathname === "/__fumi/editor" || pathname === "/__fumi/editor/") {
          const htmlPath = resolve(fileURLToPath(import.meta.resolve("#editor/index.html")));
          if (!existsSync(htmlPath)) {
            res.statusCode = 503;
            res.end("Editor not built. Run: pnpm -F @tenjot/fumi build");
            return;
          }
          res.setHeader("Content-Type", "text/html; charset=utf-8");
          res.end(readFileSync(htmlPath, "utf-8"));
          return;
        }

        if (url.startsWith("/__fumi/editor/")) {
          const filename = url.slice("/__fumi/editor/".length).split("?")[0];
          const filePath = resolve(fileURLToPath(import.meta.resolve(`#editor/${filename}`)));
          if (existsSync(filePath)) {
            const mime: Record<string, string> = {
              ".css": "text/css",
              ".js": "application/javascript",
              ".mjs": "application/javascript",
              ".ts": "application/javascript",
            };
            res.setHeader("Content-Type", mime[extname(filePath)] ?? "text/plain");
            res.end(readFileSync(filePath));
            return;
          }
          next();
          return;
        }

        if (url === "/__fumi/api/files" && req.method === "GET") {
          const files = discoverMarkdownFiles(root).map((f) =>
            relative(root, f).replace(/\\/g, "/"),
          );
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(files));
          return;
        }

        const fileMatch = url.match(/^\/__fumi\/api\/file\?path=(.+)$/);
        if (fileMatch) {
          const reqPath = decodeURIComponent(fileMatch[1]);
          const filePath = resolve(root, reqPath);
          // パストラバーサル防止
          if (!filePath.startsWith(root)) {
            res.statusCode = 403;
            res.end("Forbidden");
            return;
          }
          if (req.method === "GET") {
            try {
              res.setHeader("Content-Type", "text/plain; charset=utf-8");
              res.end(readFileSync(filePath, "utf-8"));
            } catch {
              res.statusCode = 404;
              res.end("Not found");
            }
            return;
          }
          if (req.method === "PUT") {
            const body = await readBody(req);
            writeFileSync(filePath, body, "utf-8");
            res.setHeader("Content-Type", "text/plain");
            res.end("ok");
            return;
          }
          if (req.method === "POST") {
            try {
              readFileSync(filePath);
              res.statusCode = 409;
              res.end("Conflict");
            } catch {
              const body = await readBody(req);
              mkdirSync(dirname(filePath), { recursive: true });
              writeFileSync(filePath, body, "utf-8");
              res.setHeader("Content-Type", "text/plain");
              res.end("ok");
            }
            return;
          }
        }

        next();
      });
    },
  };
}
