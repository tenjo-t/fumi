# ランタイムAPI

Fumiには、アプリのデータへアクセスするための組み込みAPIがいくつか用意されています。さらに、グローバルに使用できる組み込みコンポーネントも提供されています。

ランタイムAPIは`@tenjot/fumi/client`からインポートでき、カスタムテーマのVueコンポーネントで使用します。`use*`で始まるメソッドは[Vue 3 Composition API](https://vuejs.org/guide/introduction.html#composition-api)の関数（Composable）で、`setup()`または`<script setup>`の中でのみ使用できます。

## useData

サイト/ページのデータを返します。返り値の型は次のとおりです。

```ts
interface SiteData {
  page: Ref<PageData>;
}

interface PageData {
  path: string;
  isNotFound: boolean;
  frontmatter?: Record<string, unknown>;
}
```

## useRoute

現在のルートオブジェクトを返します。返り値の型は次のとおりです。

```ts
interface Route {
  path: string;
  component: Component | null;
  data: PageData;
}
```

## Content

レンダリング済のMarkdownコンテンツを表示します。

```vue
<template>
  <h1>Custom Layout</h1>
  <Content />
</template>
```
