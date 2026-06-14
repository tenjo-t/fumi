import { inject, markRaw, reactive, type Component } from "vue";
import { PageData } from "./data";

export const RouterSymbol = Symbol();

export interface Route {
  /** 現在のページのパス (`new URL(location.href).pathname`と同じ) */
  path: string;
  /** 現在のページのコンポーネント */
  component: Component | null;
  /** 現在のページのメタデータ */
  data: PageData;
}

export interface Router {
  /** 現在のルート情報 */
  route: Route;
}

export function createRouter(initialRoute?: Partial<Route>): Router {
  const route = reactive<Route>({
    path: initialRoute?.path ?? "/",
    component: initialRoute?.component ? markRaw(initialRoute.component) : null,
    data: initialRoute?.data ?? { path: "/", isNotFound: true },
  });

  if (typeof navigation !== "undefined") {
    navigation.addEventListener("navigate", (e: NavigateEvent) => {
      if (!e.canIntercept || e.hashChange || e.downloadRequest !== null) return;
      const url = new URL(e.destination.url);
      if (url.origin !== location.origin) return;

      if (import.meta.env.DEV && url.pathname.startsWith("/__fumi/editor")) return;

      e.intercept({
        async handler() {
          const page = await loadPage(url.pathname);
          route.component = page.default ? markRaw(page.default) : null;
          route.path = url.pathname;
          route.data = page.__pageData;
        },
      });
    });
  }

  return { route };
}

export function pathToPageComponentPath(pathname: string) {
  let path = pathname.replace(/\.html$/, "");
  if (path === "/" || path === "") path = "/index";
  else if (path.endsWith("/")) path = path.slice(0, -1) + "/index";
  return `/__app${path}.js`;
}

export async function loadPage(
  pathname: string,
): Promise<{ default?: Component; __pageData: PageData }> {
  try {
    return await import(/* @vite-ignore */ pathToPageComponentPath(pathname));
  } catch (e) {
    if (!(e instanceof TypeError)) throw e;
    const page = await import(/* @vite-ignore */ "/__app/404.js" as string);
    return {
      default: page?.default,
      __pageData: { ...page?.__pageData, url: pathname, isNotFound: true },
    };
  }
}

/**
 * ルーター
 * ナビゲーションにはNavigation APIを使用します。
 */
export function useRouter(): Router {
  const router = inject<Router>(RouterSymbol);
  if (!router) throw new Error("useRouter() is called without provider.");
  return router;
}

/** 現在のルート情報 */
export function useRoute(): Route {
  return useRouter().route;
}
