import { type Component, markRaw } from "vue";
import { createApp } from "./app";
import { loadPage } from "./router";
import { useHead } from "./head";

export function initApp(root: Component, container: Element) {
  const path = location.pathname;
  loadPage(path).then(({ default: cmp, __pageData }) => {
    const component = cmp ? markRaw(cmp) : null;
    const { app, router } = createApp(root, { path, component, data: __pageData });
    useHead(router.route);
    app.mount(container);
  });
}
