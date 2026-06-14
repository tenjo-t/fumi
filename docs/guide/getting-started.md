# はじめに

## インストール

FumiはVite, Vue上に構築されているためインストールが必要です。

```sh
npm install @tenjot/fumi vite vue
```

## ブラウザーサポート

FumiはNavigation APIを使用しており、Chrome 102+, Edge 102+, Firefox 147+, Safari 26.2+でサポートされています。

## ファイル構成

```txt
.
├─ .fumi
│  ├─ App.vue
│  └─ index.html
├─ api-examples.md
├─ markdown-examples.md
├─ index.md
├─ package.json
└─ vite.config.ts
```

Fumiはファイルベースのルーティングを採用しています。各Markdownファイルは同じパスを持つHTMLファイルとしてビルドされます。例えば、`index.md`は`index.html`としてビルドされます。

`.fumi`ディレクトリ外のMarkdownファイルはソースファイルとみなされビルド対象になります。

### 設定ファイル

`@tenjot/fumi`の`defineConfig`を使用してFumi用にViteコンフィグを上書きします。

```ts
import { defineConfig } from "@tenjot/fumi";

export default defineConfig({});
```

## 実行する

FumiはVite上に構築されているためViteコマンドを使用します。

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build --app",
    "preview": "vite preview"
  }
}
```
