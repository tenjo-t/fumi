import { posix } from "node:path";
import type { Plugin } from "vite";

// href / src 属性の値を取り出す
const ATTR_RE = /\b(href|src)\s*=\s*(["'])([^"']*)\2/g;

// 書き換え不要なURL（絶対パス・プロトコル付き・data:・#アンカーなど）
function isAbsolute(url: string): boolean {
  return (
    url === "" ||
    url[0] === "/" ||
    url[0] === "#" ||
    /^[a-z][a-z0-9+.-]*:/i.test(url) || // http: data: mailto: など
    url.startsWith("//")
  );
}

/**
 * `.fumi/index.html` 内の相対パスを root からの絶対パスに書き換える。
 *
 * テンプレートは `.fumi/` 配下にあるが任意のURLで配信されるため、
 * `./style.css` のような相対パスはブラウザ側で正しく解決できない。
 * `.fumi/` を基準に `/.fumi/style.css` のような絶対パスへ変換する。
 */
function rewriteRelativeUrls(html: string, baseDir: string): string {
  return html.replace(ATTR_RE, (match, attr, quote, url) => {
    if (isAbsolute(url)) return match;
    const resolved = posix.join(baseDir, url);
    return `${attr}=${quote}${resolved}${quote}`;
  });
}

export function html(): Plugin {
  // `.fumi/` を基準にする
  const baseDir = "/.fumi/";

  return {
    name: "fumi:html",

    transformIndexHtml: {
      order: "pre",
      handler(html) {
        return {
          html: rewriteRelativeUrls(html, baseDir),
          tags: [
            {
              tag: "script",
              attrs: { type: "module" },
              children: [
                `import App from "/.fumi/App.vue";`,
                `import { initApp } from "@tenjot/fumi/client";`,
                `initApp(App, document.getElementById("app"));`,
              ].join("\n"),
            },
          ],
        };
      },
    },
  };
}
