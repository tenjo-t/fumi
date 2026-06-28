# フロントマター設定

フロントマターではページ単位の設定が可能です。

使用例：

```md
---
title: Docs with Fumi
titleTemplate: false
---
```

## title

- 型：`string`

ページのタイトルです。`config.title`と同じ意味でサイトレベルの設定を上書きします。

## titleTemplate

- 型：`string | false`

タイトルのサフィックスです。`config.titleTemplate`と同じ意味でサイトレベルの設定を上書きします。

## description

- 型：`string`

ページの説明です。`config.description`と同じ意味でサイトレベルの設定を上書きします。

## head

- 型：`HeadConfig[]`

現在のページに追加で挿入する`<head>`タグを指定します。サイトレベル設定で挿入されたタグの後に追加されます。

```ts
export type HeadConfig =
  | [tag: string, attr: Record<string, string>]
  | [tag: string, attr: Record<string, string>, content: string];
```
