import type { Plugin } from "vite";
import { type PluggableList, type Plugin as UnifiedPlugin, unified } from "unified";
import type { Root } from "hast";
import { select } from "hast-util-select";
import { toText } from "hast-util-to-text";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import matter from "gray-matter";
import type { PageData } from "../client/data";
import { type FumiConfig, resolveFumiConfig } from "../config";
import { fileToUrl, rewritePath } from "../route";

export interface MarkdownOptions {
  /** remark-parse の後に適用する remark プラグイン */
  remarkPlugins?: PluggableList;
  /** remark-rehype の後に適用する rehype プラグイン */
  rehypePlugins?: PluggableList;
}

const extractTitle: UnifiedPlugin<[], Root> = function () {
  return (tree, file) => {
    const node = select("h1", tree);
    if (node) {
      file.data.title = toText(node);
    }
  };
};

export function createProcessor(options: MarkdownOptions = {}) {
  let remark = unified().use(remarkParse);
  if (options.remarkPlugins?.length) remark = remark.use(options.remarkPlugins);
  let rehype = remark.use(remarkRehype, { allowDangerousHtml: true });
  if (options.rehypePlugins?.length) rehype = rehype.use(options.rehypePlugins);
  rehype.use(extractTitle);
  return rehype.use(rehypeStringify, { allowDangerousHtml: true });
}

export function markdown(options: MarkdownOptions, config: FumiConfig): Plugin {
  const processor = createProcessor(options);
  let root: string;
  return {
    name: "fumi:markdown",
    configResolved(config) {
      root = config.root;
    },
    transform: {
      filter: { id: /\.md$/ },
      async handler(code, id) {
        const { content, data: frontmatter } = matter(code);
        const file = await processor.process(content);
        const html = JSON.stringify(`<div class="fumi-markdown-content">${file.toString()}</div>`);

        const pageConfig: FumiConfig = { ...frontmatter };
        if (pageConfig.title == null && file.data.title != null) {
          pageConfig.title = file.data.title as string;
        }
        const resolvedConfig = resolveFumiConfig(config, pageConfig);
        const path = rewritePath(config.rewrites, fileToUrl(id, root));

        const data: PageData = {
          path,
          isNotFound: path === "/404.html",
          frontmatter,
          ...resolvedConfig,
        };

        return `import { createStaticVNode } from "vue";
export default { render: () => createStaticVNode(${html}, 1) };
export const __pageData = JSON.parse(${JSON.stringify(JSON.stringify(data))})`;
      },
    },
  };
}
