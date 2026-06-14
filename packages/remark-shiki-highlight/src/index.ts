import type { Plugin } from "unified";
import type { Root } from "mdast";
import { visit } from "unist-util-visit";
import {
  getSingletonHighlighter,
  bundledLanguages,
  CodeOptionsThemes,
  BuiltinTheme,
  isSpecialLang,
} from "shiki";

type Options = CodeOptionsThemes;

const remarkTreeSitterHighlight: Plugin<[Options], Root> = function (options) {
  const themes = ("themes" in options ? Object.values(options.themes) : [options.theme]).filter(
    Boolean,
  ) as BuiltinTheme[];
  const langs = Object.keys(bundledLanguages);

  let getHandler: ReturnType<typeof getSingletonHighlighter>;

  return async (tree) => {
    if (!getHandler) {
      getHandler = getSingletonHighlighter({ langs, themes });
    }
    const highlighter = await getHandler;

    visit(tree, "code", (node, index, parent) => {
      if (!parent || index == null) return;

      const lang = node.lang;
      if (!lang && !highlighter.getLoadedLanguages().includes(lang) && !isSpecialLang(lang)) return;

      const html = highlighter.codeToHtml(node.value, { ...options, lang });
      parent.children[index] = {
        type: "html",
        value: html,
      };
    });
  };
};

export default remarkTreeSitterHighlight;
