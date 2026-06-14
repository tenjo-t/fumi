# サイト設定

サイト設定ではサイト全体の設定を行います。

## 設定ファイル

Fumiは完全にViteの上に構築されているため、サイト設定は`vite.config.[ext]`に記載します。

`@tenjo/fumi`の`defineConfig`を用いて設定します。この関数はViteのような単なるヘルパー関数ではなく、渡された設定をもとにViteの設定を行うため必ず使用してください。

```ts
// vite.config.ts
import { defineConfig } from "@tenjot/fumi";

export default defineConfig({
  title: "Fumi",
  titleTemplate: ":title | Fumi",
  description: "A static site generator for Vue + remark",
});
```

`vite.config.ts`の詳細はViteの[ドキュメント](https://ja.vite.dev/config/)を参照してください。

## サイトメタデータ

### title

- 型：`string`
- ページ単位での上書き：frontmatter

サイトのタイトル。ページ単位で設定されていない場合のフォールバックになります。

### titleTemplate

- 型：`string | false`
- ページ単位での上書き：frontmatter

タイトルの描画方法をカスタマイズします。`titleTemplate`内で`:title`シンボルを使用することで各ページの`title`を埋め込みます。

```ts
defineConfig({
  title: "Hello",
  titleTemplate: ":title | Fumi",
});
```

この場合`Hello | Fumi`と描画されます。

また、`false`と設定することでテンプレートの使用を止め、`title`のみを描画します。

### description

- 型：`string`
- ページ単位での上書き：frontmatter

サイトの説明。ページのHTMLに`<meta>`タグとして出力されます。

### head

- 型：`HeadConfig[]`
- ページ単位での上書き：frontmatter

ページHTMLの`<head>`に追加で出力する要素。

```ts
export type HeadConfig =
  | [tag: string, attr: Record<string, string>]
  | [tag: string, attr: Record<string, string>, content: string];
```

#### 例：faviconを追加

```ts
defineConfig({
  head: [["link", { rel: "icon", href: "/favicon.ico" }]],
});
// favicon.icoはpublicに配置。baseを設定している場合は/base/favicon.icoを利用
```

```html
<link rel="icon" href="/favicon.ico" />
```

### lang

- 型：`string`

サイトの言語属性。ページHTMLの`<html lang="en-US">`として出力されます。

## カスタマイズ

### Markdown

- 型：`MarkdownOptions`

```ts
import type { PluggableList } from "unified";
interface MarkdownOptions {
  remarkPlugins?: PluggableList;
  rehypePlugins?: PluggableList;
}
```

Markdownパーサーのカスタマイズ。FumiはMarkdownの変換にRemark/Rehypeを使用しており、Unifiedエコシステムを利用できます。`PluggableList`の詳細はUnifiedの[ドキュメント](https://github.com/unifiedjs/unified#pluggablelist)を参照してください。

```ts
defineConfig({
  markdown: {
    // remark-parseの後に適用されるremarkプラグイン
    remarkPlugins: [],
    // remark-rehypeの後に適用されるrehypeプラグイン
    rehypePlugins: [],
    // その後rehype-stringifyによってHTMLに変換される
  },
});
```

### Vite

- 型： `import("vite").UserConfig`

本来のVite設定はここで設定します。Fumi用のプラグインやエイリアスが追加で設定されます。APIはViteの[ドキュメント](https://ja.vite.dev/config/)を参照してください。

```ts
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
});
```

### Vue

- 型：`import("@vitejs/plugin-vue").Options`

`@vitejs/plugin-vue`はFumiによって追加されるため、オプションはここで変更します。Fumiはオプションをそのまま渡します。APIは`@vitejs/plugin-vue`の[ドキュメント](https://github.com/vitejs/vite-plugin-vue/tree/main/packages/plugin-vue)を参照してください。

```ts
export default defineConfig({
  vue: {},
});
```
