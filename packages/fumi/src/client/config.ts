import type { HeadConfig, ResolvedFumiConfig } from "../config";

export function resolveTitle(config: ResolvedFumiConfig): string | undefined {
  return config.title
    ? (config.titleTemplate?.replaceAll(":title", config.title) ?? config.title)
    : config.titleTemplate;
}

export function configToHeadConfig(config: ResolvedFumiConfig): HeadConfig[] {
  const head = config.head ?? [];
  const title = resolveTitle(config);

  if (title) {
    head.push(["title", {}, title]);
  }
  if (config.description) {
    head.push(["meta", { name: "description", content: config.description }]);
  }

  return head;
}
