import { join, resolve } from "node:path";
import type hast from "hast";
import { toHtml } from "hast-util-to-html";
import type { HeadConfig } from "./config";
import { fileURLToPath } from "node:url";

export const ROOT = resolve(fileURLToPath(import.meta.url), "..");
export const APP = join(ROOT, "main.mjs");

function headConfigToHast(head: HeadConfig[]): hast.Element[] {
  return head.map(([tagName, a, c]) => {
    const children: hast.Text[] = c == null ? [] : [{ type: "text", value: c }];
    return { type: "element", tagName, properties: a, children };
  });
}

export function headConfigStringify(head: HeadConfig[]): string {
  return toHtml(headConfigToHast(head));
}
