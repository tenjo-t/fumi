import { computed, inject, Ref } from "vue";
import type { Route } from "./router";
import type { ResolvedFumiConfig } from "../config";

export const DataSymbol = Symbol();

/** Page-level metadata */
export interface PageData extends ResolvedFumiConfig {
  /** 現在のページのパス (`/`は`/index.html`となる) */
  path: string;
  /** もしページが見つからない場合trueになる */
  isNotFound: boolean;
  /** Markdown frontmatter */
  frontmatter?: Record<string, unknown>;
}

/** Fumi metadata */
export interface SiteData {
  /** Page-level metadata */
  page: Ref<PageData>;
}

export function initData(route: Route): SiteData {
  return {
    page: computed(() => route.data),
  };
}

/** サイトのメタデータ */
export function useData(): SiteData {
  const data = inject<SiteData>(DataSymbol);
  if (!data) {
    throw new Error("fumi data not properly injected in app");
  }
  return data;
}
