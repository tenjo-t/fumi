import path from "path";
import type { Plugin } from "vite";
import { loadConfigFromFile, normalizePath } from "vite";
import { glob } from "tinyglobby";
import pm from "picomatch";
import type { DataLoader } from "../content-loader";
import { createProcessor, MarkdownOptions } from "./markdown";
import { readFile } from "fs/promises";
import matter from "gray-matter";
import { type FumiConfig, resolveFumiConfig } from "../config";

export function dataLoader(markdownOptions: MarkdownOptions, config: FumiConfig): Plugin {
  const cache = new Map<string, string>();
  const depToLoaderModuleIdsMap = new Map<string, Set<string>>();
  const idToLoaderModulesMap = new Map<string, DataLoader<unknown>>();

  return {
    name: "fumi:data-loader",

    sharedDuringBuild: true,

    load: {
      filter: { id: /\.data\.[tj]s$/ },
      async handler(id) {
        const root = this.environment.config.root;
        const isBuild = this.environment.config.command === "build";

        let loader: DataLoader<unknown>;
        const existing = idToLoaderModulesMap.get(id);
        if (existing) {
          loader = existing;
        } else {
          // tsをコンパイルしてインポートするために利用
          const res = await loadConfigFromFile({} as any, id);

          if (!res?.config) return null;

          if (!isBuild) {
            for (const dep of res.dependencies) {
              const depPath = normalizePath(path.resolve(dep));
              let set = depToLoaderModuleIdsMap.get(depPath);
              if (!set) {
                depToLoaderModuleIdsMap.set(depPath, (set = new Set()));
              }
              set.add(id);
            }
          }

          loader = res.config as DataLoader<unknown>;
          if (!isBuild) {
            idToLoaderModulesMap.set(id, loader);
          }
        }

        let data;
        if (loader.watch) {
          const watchFiles = (
            await glob(loader.watch, {
              absolute: true,
              expandDirectories: true,
              ignore: ["**/node_modules/**", "**/.fumi/**"],
            })
          ).sort();
          const processor = createProcessor(markdownOptions);
          data = await loader.load(watchFiles, async (file) => {
            const src = await readFile(file, "utf-8");
            const { content, data: frontmatter } = matter(src);
            const vfile = await processor.process(content);

            const pageConfig: FumiConfig = { ...frontmatter };
            if (pageConfig.title == null && vfile.data.title != null) {
              pageConfig.title = vfile.data.title as string;
            }
            const resolvedConfig = resolveFumiConfig(config, pageConfig);

            const path = file.replace(".md", ".html").replace(root, "");

            return {
              path: config.rewrites?.(path) ?? path,
              isNotFound: false,
              ...resolvedConfig,
              frontmatter,
            };
          });
        } else {
          data = await loader.load();
        }

        if (!isBuild) {
          idToLoaderModulesMap.set(id, loader);
        }

        const result = `export const data = JSON.parse(${JSON.stringify(JSON.stringify(data))})`;

        return result;
      },
    },
    hotUpdate({ file, modules: existingMods }) {
      if (this.environment.name !== "client") return;

      const modules = [];
      const normalizedFile = normalizePath(file);

      if (depToLoaderModuleIdsMap.has(normalizedFile)) {
        for (const id of depToLoaderModuleIdsMap.get(normalizedFile) ?? []) {
          idToLoaderModulesMap.delete(id);
          const mod = this.environment.moduleGraph.getModuleById(id);
          if (mod) modules.push(mod);
        }
      }

      for (const [id, loader] of idToLoaderModulesMap.entries()) {
        if (loader.watch?.length && pm(loader.watch)(normalizedFile)) {
          const mod = this.environment.moduleGraph.getModuleById(id);
          if (mod) modules.push(mod);
        }
      }

      return modules.length ? [...existingMods, ...modules] : undefined;
    },
  };
}
