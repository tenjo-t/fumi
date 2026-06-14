import { markRaw } from "vue";
import { createApp } from "./app";
import { loadPage } from "./router";
import { useHead } from "./head";

const path = location.pathname;

loadPage(path).then(({ default: cmp, __pageData }) => {
  const component = cmp ? markRaw(cmp) : null;
  const { app, router } = createApp({ path, component, data: __pageData });
  useHead(router.route);
  app.mount("#app");
});
