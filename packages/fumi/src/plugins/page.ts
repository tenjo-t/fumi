import type { Plugin } from "vite";
import { statSync } from "fs";
import { resolve } from "path";

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
          const path = normalized.replace(/^\/__app\//, "").replace(/\.js$/, "");

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
