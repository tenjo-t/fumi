<script lang="ts" setup>
import { computed } from "vue";
import { Content, useData } from "@tenjot/fumi/client";
import { data as guide } from "../guide.data";
import { data as reference } from "../reference.data";

type Frontmatter = {};

const { page } = useData();
const frontmatter = computed(() => page.value.frontmatter as Frontmatter);

const prev = computed(() => {
  const current = page.value.path;
  const arr = current.startsWith("/guide")
    ? guide
    : current.startsWith("/reference")
      ? reference
      : [];
  const i = arr.findIndex((v) => v.path === current);
  if (i < 1) return null;
  return arr[i - 1];
});
const next = computed(() => {
  const current = page.value.path;
  const arr = current.startsWith("/guide")
    ? guide
    : current.startsWith("/reference")
      ? reference
      : [];
  const i = arr.findIndex((v) => v.path === current);
  if (i < 0 || arr.length === i) return null;
  return arr[i + 1];
});
</script>

<template>
  <Content />
  <aside class="pt-12 grid grid-cols-2 gap-8">
    <template v-if="prev != null">
      <a class="block p-3 border border-taupe-300 rounded-lg" :href="prev.path">
        <div class="text-sm">Previous page</div>
        <div class="text-yellow-800">{{ prev.title }}</div>
      </a>
    </template>
    <template v-if="next != null">
      <a class="col-start-2 block p-3 border border-taupe-300 rounded text-right" :href="next.path">
        <div class="text-sm">Next page</div>
        <div class="text-yellow-800">{{ next.title }}</div>
      </a>
    </template>
  </aside>
</template>

<style>
@reference "tailwindcss";

.fumi-markdown-content {
  @apply space-y-4;

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    @apply text-taupe-900 font-bold;
  }

  h1 {
    @apply text-2xl pb-8;
  }

  h2 {
    @apply text-xl pt-8;
  }

  h3 {
    @apply text-lg pt-4;
  }

  .shiki {
    @apply p-4 border border-taupe-200 rounded-lg overflow-x-auto;
  }

  code {
    @apply text-sm;
  }

  :where(p, ol, ul) code {
    @apply inline-block px-1 py-px mx-1 bg-taupe-200 text-yellow-950 rounded-sm;
  }

  a {
    @apply underline hover:no-underline focus:no-underline text-yellow-800;
  }
}
</style>
