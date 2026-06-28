import type { Component } from "vue";
import { renderToString } from "vue/server-renderer";
import { createApp } from "./client/app";
import type { PageData } from "./client/data";

/** FumiをSSR用にレンダリングする */
export async function render(root: Component, path: string, component: Component, data: PageData) {
  const { app } = createApp(root, { path, component, data });
  return await renderToString(app);
}
