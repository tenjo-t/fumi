import { watchEffect } from "vue";
import type { HeadConfig } from "../config";
import { resolveTitle } from "./config";
import type { Route } from "./router";

export function useHead(route: Route) {
  let isFirstUpdate = true;
  let elements: (HTMLElement | undefined)[] = [];

  function updateHead(tags: HeadConfig[]) {
    // hydration
    if (isFirstUpdate) {
      isFirstUpdate = false;
      const children = [...document.head.children];
      for (const tag of tags) {
        const newEl = createHeadElement(tag);
        const el = children.find((el) => el.isEqualNode(newEl));
        if (el != null) {
          elements.push(el as HTMLElement);
        }
      }
      return;
    }

    const newElements: (HTMLElement | undefined)[] = tags.map(createHeadElement);
    for (const [oldIndex, oldEl] of elements.entries()) {
      const matched = newElements.findIndex((el) => el?.isEqualNode(oldEl ?? null));
      if (matched !== -1) {
        delete newElements[matched];
      } else {
        oldEl?.remove();
        delete elements[oldIndex];
      }
    }
    for (const el of newElements) {
      if (el) {
        document.head.appendChild(el);
      }
    }
    elements = [...elements, ...newElements].filter(Boolean);
  }

  watchEffect(() => {
    const config = route.data;
    const title = resolveTitle(config);
    if (title !== document.title && title) {
      document.title = title;
    }

    const metaDescElm = document.querySelector("meta[name=description]");
    if (metaDescElm) {
      if (!config.description) {
        metaDescElm.remove();
      } else if (metaDescElm.getAttribute("content") !== config.description) {
        metaDescElm.setAttribute("content", config.description);
      }
    } else if (config.description) {
      createHeadElement(["meta", { name: "description", content: config.description }]);
    }

    updateHead(config.head ?? []);
  });
}

function createHeadElement([tag, attrs, innerHTML]: HeadConfig) {
  const el = document.createElement(tag);
  for (const key in attrs) {
    el.setAttribute(key, attrs[key]);
  }
  if (innerHTML) {
    el.innerHTML = innerHTML;
  }
  if (tag === "script" && attrs.async == null) {
    // async is true by default for dynamically created scripts
    (el as HTMLScriptElement).async = false;
  }
  return el;
}
