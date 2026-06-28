# ルーティング

Fumiでは初回訪問では事前に生成された静的HTMLを返し、その後のサイト間のナビゲーションはシングルページアプリケーション（SPA）として動作します。

## ファイルベースのルーティング

Fumiはファイルベースのルーティングを採用しており、生成されるHTMLはソースのMarkdownファイルのディレクトリ構造に対応します。例えば、次のディレクトリ構造があるとします。

```txt
.
├─ guide
│  ├─ getting-started.md
│  └─ index.md
├─ index.md
└─ prologue.md
```

生成されるHTMLは次のとおりです。

```txt
index.md                  -->  /index.html （/ でアクセス可能）
prologue.md               -->  /prologue.html
guide/index.md            -->  /guide/index.html （/guide/ でアクセス可能）
guide/getting-started.md  -->  /guide/getting-started.html
```

生成されたHTMLは、静的ファイルを配信できる任意のWebサーバーでホストできます。

## プロジェクトルート

プロジェクトルートはFumiが特別なディレクトリである`.fumi`を探しに行く場所です。`.fumi`ディレクトリはテーマコードのために予約されています。

プロジェクトルートはViteの[`<root>`](https://ja.vite.dev/guide/#index-html-and-project-root)と同一です。ルートを変更するにはViteコマンドにパスを渡します。

```sh
vite dev docs
```

```txt
.
├─ docs                    # プロジェクトルート
│  ├─ .fumi.               # 設定ディレクトリ
│  ├─ getting-started.md
│  └─ index.md
└─ ...
```

これにより、ソースからHTMLへのマッピングは次のようになります。

```txt
docs/index.md            -->  /index.html
docs/getting-started.md  -->  /getting-started.html
```

### ソースディレクトリ

Markdownファイルを配置するソースディレクトリは現在ルートディレクトリと同一です。

## クライアントでのルーティング

クライアントサイドでのルーティングでは従来のHistory APIを使用したものではなく、新しく標準化された[Navigation API](https://developer.mozilla.org/ja/docs/Web/API/Navigation_API)を使用しています。

このため、MarkdownやVueといったファイルの種類に関係なく、`<Link>`といった特別なコンポーネントなしにブラウザのデフォルトのルーティングによりSPA遷移をすることができます。

```md
[はじめに](./getting-started.md)
```

```html
<a href="./getting-started.md">はじめに</a>
```
