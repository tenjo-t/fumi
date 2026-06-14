import { createSSRApp } from "vue";
import App from "@app";
import { createRouter, RouterSymbol, type Route } from "./router";
import { DataSymbol, initData } from "./data";

/** 初期ルートを元にVue appを作成する */
export function createApp(initialRoute?: Partial<Route>) {
  const app = createSSRApp(App);
  const router = createRouter(initialRoute);
  app.provide(RouterSymbol, router);
  const data = initData(router.route);
  app.provide(DataSymbol, data);
  return { app, router };
}
