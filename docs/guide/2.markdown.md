# Markdown拡張

FumiはMarkdownの処理にRemarkおよびRehypeを使用しており、プラグインにより自由に拡張することができます。

## Remark

FumiはデフォルトでCommomMarkに準拠しています。GFM等の拡張を使用する場合にはRemarkプラグインを設定します。

```ts
// vite.config.ts
import { defineConfig } from "@tenjot/fumi";
import remarkGfm from "remark-gfm";

export default defineConfig({
  markdown: {
    remarkPlugins: [remarkGfm],
  },
});
```

## Rehype

パースされたMarkdownはRemark-Rehypeによりhast、HTML文字列に変換されます。Remarkと同様にプラグインによって変換することができます。

```ts
// vite.config.ts
import { defineConfig } from "@tenjot/fumi";
import rehypeExternalLinks from "rehype-external-links";

export default defineConfig({
  markdown: {
    rehypePlugins: [rehypeExternalLinks],
  },
});
```
