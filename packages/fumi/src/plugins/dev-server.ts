import {
  type Plugin,
  type ViteDevServer,
  type EnvironmentModuleNode,
  createFilter,
  type RunnableDevEnvironment,
} from "vite";
import { readFileSync } from "fs";
import { resolve } from "path";
import { pathToPageComponentPath } from "../client/router";
import type { HeadConfig } from "../config";
import { configToHeadConfig } from "../client/config";
import { headConfigStringify } from "../utils";

const isCss = createFilter(
  [/\.css(?:$|\?)/],
  [/[?&](?:worker|sharedworker|raw|url)\b/, /[?&]commonjs-proxy/],
);

export function devServer(): Plugin {
  return {
    name: "fumi:dev-server",
    apply: "serve",

    configureServer(server) {
      return dev(server);
    },
  };
}

async function dev(server: ViteDevServer) {
  const root = server.config.root;
  const fumiRoot = resolve(root, ".fumi");

  const ssrEnv = server.environments.ssr as RunnableDevEnvironment;
  const clientEnv = server.environments.client;

  return () => {
    server.middlewares.use(async (req, res, next) => {
      try {
        const url = req.originalUrl ?? req.url ?? "/";

        if (url.endsWith(".map")) return next();
        if (url === "/favicon.ico") return next();
        if (url.startsWith("/__app/")) return next();
        if (url.startsWith("/@")) return next();

        let html = readFileSync(resolve(fumiRoot, "index.html"), "utf-8");
        html = await server.transformIndexHtml(url, html);

        const { render } = await import("#ssr");
        const { default: root } = await ssrEnv.runner.import(".fumi/App.vue");

        const pageComponentPath = pathToPageComponentPath(url);
        const { default: component, __pageData } = await ssrEnv.runner
          .import(pageComponentPath)
          .catch(async (e) => {
            if (e.code !== "ERR_LOAD_URL") throw e;

            const page = await ssrEnv.runner.import("/__app/404.js").catch(() => undefined);
            return {
              default: page?.default,
              __pageData: { ...page?.__pageData, path: url, isNotFound: true },
            };
          });
        const appHtml = await render(root, url, component, __pageData);
        if (appHtml === null) return next();

        const pageMod = await clientEnv.moduleGraph.getModuleByUrl("/.fumi/App.vue");
        const styleTag = pageMod ? renderCss(pageMod) : [];
        const headTag = configToHeadConfig(__pageData);
        const appHead = headConfigStringify([...styleTag, ...headTag]);

        html = html.replace("<!--app-html-->", appHtml);
        html = html.replace("<!--app-head-->", appHead);

        res.writeHead(component != null ? 200 : 404, { "Content-Type": "text/html" });
        res.end(html);
      } catch (e) {
        server.ssrFixStacktrace(e as Error);
        console.error(e);
        next(e);
      }
    });
  };
}

const viteCssRe = /\bconst __vite__css\s*=\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`[\s\S]*?`)/;
const viteIdRe = /\bconst __vite__id\s*=\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`[\s\S]*?`)/;

function renderCss(entry: EnvironmentModuleNode, visited: Set<string> = new Set()): HeadConfig[] {
  const result: HeadConfig[] = [];
  for (const mod of entry.importedModules) {
    if (mod.id === null || visited.has(mod.id)) continue;
    visited.add(mod.id);

    if (isCss(mod.url)) {
      const style = renderCssMod(mod);
      if (!style) continue;
      result.push(style);
    } else {
      result.push(...renderCss(mod, visited));
    }
  }
  return result.filter(Boolean);
}

function renderCssMod(mod: EnvironmentModuleNode): HeadConfig | null {
  const code = mod.transformResult?.code;
  if (!code) return null;

  // `const css = "..."` または テンプレートリテラル形式から CSS を抽出
  const css = viteCssRe.exec(code);
  if (!css) return null;
  const id = viteIdRe.exec(code);
  if (!id) return null;

  return ["style", { "data-vite-dev-id": JSON.parse(id[1]) }, JSON.parse(css[1])];
}
