import { renderToString } from "vue/server-renderer";
import { createApp } from "./client/app";
import { Component } from "vue";
import { PageData } from "./client/data";

/** FumiをSSR用にレンダリングする */
export async function render(url: string, component: Component, data: PageData) {
  const { app } = createApp({ path: url, component, data });
  return await renderToString(app);
}
