import { defineLoader, LoadedData } from "@tenjot/fumi";

const loader = defineLoader({
  watch: ["reference/*.md"],
  async load(watchFiles, loadMarkdown) {
    return await Promise.all(
      watchFiles.toSorted().map(async (path) => {
        const data = await loadMarkdown(path);
        return {
          title: data.title,
          path: data.path,
        };
      }),
    );
  },
});

export default loader;

declare const data: LoadedData<typeof loader>;
export { data };
