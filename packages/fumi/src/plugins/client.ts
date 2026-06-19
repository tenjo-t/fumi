import type { Plugin } from "vite";

export function client(): Plugin {
  return {
    name: "fumi:client",

    transformIndexHtml: {
      order: "pre",
      handler(html) {
        return {
          html,
          tags: [
            {
              tag: "script",
              attrs: { type: "module" },
              children: [
                `import App from "/.fumi/App.vue";`,
                `import { initApp } from "@tenjot/fumi/client";`,
                `initApp(App, document.getElementById("app"));`,
              ].join("\n"),
            },
          ],
        };
      },
    },
  };
}
