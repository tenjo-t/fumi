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
import type { HeadConfig, FumiConfig } from "../config";
import { configToHeadConfig } from "../client/config";
import { headConfigStringify } from "../utils";
import { rewritesDevServer } from "../route";

const isCss = createFilter(
  [/\.css(?:$|\?)/],
  [/[?&](?:worker|sharedworker|raw|url)\b/, /[?&]commonjs-proxy/],
);

export function devServer(config: FumiConfig): Plugin {
  return {
    name: "fumi:dev-server",
    apply: "serve",

    async configureServer(server) {
      return await dev(server, config);
    },
  };
}

async function dev(server: ViteDevServer, config: FumiConfig) {
  const fumiRoot = resolve(server.config.root, ".fumi");

  const ssrEnv = server.environments.ssr as RunnableDevEnvironment;
  const clientEnv = server.environments.client;

  await rewritesDevServer(server, config.rewrites);

  return () => {
    server.middlewares.use(async (req, res, next) => {
      try {
        const url = req.originalUrl ?? req.url ?? "/";

        // HTMLページのナビゲーションリクエストのみを処理し、
        // CSS・JS・Vue などのモジュール/アセットリクエストは Vite に委ねる。
        // （横取りすると transformIndexHtml に非HTMLパスが渡り、
        //  インラインスクリプトが不正な html-proxy モジュールに化ける）
        if (req.method !== "GET") return next();
        if (!req.headers.accept?.includes("text/html")) return next();
        // `.html` 以外の拡張子を持つパス（.css/.js/.vue など）はアセット/モジュール
        // リクエストなので Vite に委ねる。拡張子なし or `.html` はページとして扱う。
        const pathname = url.split("?")[0];
        const ext = pathname.slice(pathname.lastIndexOf("/") + 1).match(/\.[^.]+$/)?.[0];
        if (ext && ext !== ".html") return next();

        let html = readFileSync(resolve(fumiRoot, "index.html"), "utf-8");
        // index.html の実際の配信パスを htmlPath として渡すことで、
        // `<link href="./style.css">` などの相対URLが `.fumi/` 基準で解決される。
        // ページのルートは originalUrl（第3引数）で渡す。
        html = await server.transformIndexHtml("/.fumi/index.html", html, url);

        const { render } = await import("#ssr");
        const { default: root } = await ssrEnv.runner.import(".fumi/App.vue");

        const pageComponentPath = pathToPageComponentPath(url);
        const { default: component, __pageData } = await ssrEnv.runner
          .import(pageComponentPath)
          .catch(async (e) => {
            if (e.code !== "ERR_LOAD_URL") throw e;

            const page = await ssrEnv.runner
              .import(/* @vite-ignore */ "/__app/404.js")
              .catch(() => undefined);
            return {
              default: page?.default,
              __pageData: {
                ...page?.__pageData,
                path: config.rewrites?.(url) ?? url,
                isNotFound: true,
              },
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
