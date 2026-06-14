import { resolve } from "path";
import { default as vue, Options as VueOptions } from "@vitejs/plugin-vue";
import { defineConfig as viteDefineConfig, type UserConfig as ViteUserConfig } from "vite";
import { build } from "./plugins/build";
import { dataLoader } from "./plugins/data-loader";
import { devServer } from "./plugins/dev-server";
import { markdown, type MarkdownOptions } from "./plugins/markdown";
import { page } from "./plugins/page";

export type HeadConfig =
  | [tag: string, attr: Record<string, string>]
  | [tag: string, attr: Record<string, string>, content: string];

export interface FumiConfig {
  /** サイトタイトル。Frontmatterで上書き可能。 */
  title?: string;
  /**
   * サイトタイトルテンプレート。
   * `:title`シンボルがFrontmatterまたは`h1`から推測されたタイトルが挿入される。
   * `false`を設定するとテンプレートを無効にします。
   */
  titleTemplate?: string | false;
  /** サイトの説明。Frontmatterで上書き可能 */
  description?: string;
  /** `<head>`に追加する要素。 */
  head?: HeadConfig[];
  /** サイトの言語属性 */
  lang?: string;
}

export interface ResolvedFumiConfig extends FumiConfig {
  titleTemplate?: string;
}

export interface FumiUserConfig extends FumiConfig {
  vite?: ViteUserConfig;
  vue?: VueOptions;
  markdown?: MarkdownOptions;
}

/**
 * Viteの設定。
 * Fumiのために幾つかの設定が追加・上書きされる。
 */
export function defineConfig(userConfig: FumiUserConfig = {}) {
  const {
    vite: viteUserConfig = {},
    vue: vueOptions,
    markdown: markdownOptions = {},
    ...fumiConfig
  } = userConfig;
  const cwd = process.cwd();
  return viteDefineConfig({
    ...viteUserConfig,
    plugins: [
      vue(vueOptions),
      devServer(fumiConfig),
      build(fumiConfig),
      page(fumiConfig),
      markdown(markdownOptions, fumiConfig),
      dataLoader(markdownOptions, fumiConfig),
      ...(viteUserConfig.plugins ?? []),
    ],
    resolve: {
      ...viteUserConfig.resolve,
      alias: {
        ...viteUserConfig.resolve?.alias,
        "@app": resolve(cwd, ".fumi/App.vue"),
      },
    },
  });
}

export function resolveFumiConfig(global: FumiConfig, page: FumiConfig): ResolvedFumiConfig {
  const title = page.title ?? global.title;
  let titleTemplate =
    page.titleTemplate === false
      ? undefined
      : (page.titleTemplate ?? (global.titleTemplate === false ? undefined : global.titleTemplate));
  if (title == null) {
    if (titleTemplate?.includes(":title")) {
      // 置き換えるものがないため使用しない
      titleTemplate = undefined;
    }
  } else {
    if (!titleTemplate?.includes(":title")) {
      // 置き換える場所がないテンプレートは使用しない
      titleTemplate = undefined;
    }
  }
  const head = [...(global.head ?? []), ...(page.head ?? [])];
  return {
    title,
    titleTemplate,
    description: page.description ?? global.description,
    head: head.length ? head : undefined,
    lang: page.lang ?? global.lang,
  };
}
