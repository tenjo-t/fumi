import { Component, createSSRApp } from "vue";
import { createRouter, RouterSymbol, type Route } from "./router";
import { DataSymbol, initData } from "./data";

/** 初期ルートを元にVue appを作成する */
export function createApp(root: Component, initialRoute?: Partial<Route>) {
  const app = createSSRApp(root);
  const router = createRouter(initialRoute);
  app.provide(RouterSymbol, router);
  const data = initData(router.route);
  app.provide(DataSymbol, data);
  return { app, router };
}
