# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Fumi

独自 SSG フレームワーク。VitePress を以下の構成に置き換える作業が進行中。

- **Markdown パース**: remark（unified エコシステム）
- **SSG**: Vite + `@vue/server-renderer` による独自ビルドスクリプト
- **ルーティング**: Navigation API（クライアントサイド SPA）

## 重要な設計方針

### データフロー（SSR/クライアント共通パターン）

- プロジェクトルート以下にあるMarkdown/VueファイルがWebページに対応（`/foo/bar.md` → `/foo/bar.html`）。
- SSG用の設定、コンポーネントなどは`.fumi/`以下で行う。
- ルーティングはNavigation APIを使用する。
- `Content`コンポーネントはMarkdownを変換した結果を表示する。
- Markdown/Vueファイルをbuildしたものは`/__app/`以下から配信される。

### remark パイプライン

1. remarkParse
2. user remark plugins
3. remarkRehype
4. user rehype plugins
5. rehypeStringify

```ts
// vite.config.ts
export default {
  markdown: {
    remarkPlugin: [],
    rehypePlugin: [],
  },
};
```
