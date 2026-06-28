import { statSync } from "node:fs";
import { resolve } from "node:path";
import type { Plugin } from "vite";

export function page(): Plugin[] {
  let root: string;
  return [
    {
      name: "fumi:page",

      configResolved(config) {
        root = config.root;
      },
      resolveId: {
        filter: { id: /^\/__app\/.*\.js(?:\.(?:md|vue))?$/ },
        handler(source) {
          const normalized = source.replace(/\.(?:md|vue)$/, "");
          const path = normalized.slice(7, -3);

          const vuePath = resolve(root, `${path}.vue`);
          if (existsFile(vuePath)) return vuePath;
          const mdPath = resolve(root, `${path}.md`);
          if (existsFile(mdPath)) return mdPath;

          return null;
        },
      },
    },
  ];
}

function existsFile(path: string) {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}
