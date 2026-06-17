import type { Plugin } from "vite";
import { APP } from "../utils";

export function client(): Plugin {
  return {
    name: "fumi:client",

    transformIndexHtml: {
      order: "pre",
      handler(html) {
        return html.replace(
          "<!--app-html-->",
          `<!--app-html-->\n<script type="module" src="/@fs${APP}"></script>`,
        );
      },
    },
  };
}
