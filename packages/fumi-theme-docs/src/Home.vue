<script lang="ts" setup>
import { Content, useData } from "@tenjot/fumi/client";
import { computed } from "vue";

export type HomeFrontmatter = {
  layout: "home";
  hero: {
    name: string;
    text: string;
  };
  features: {
    title: string;
    details: string;
  }[];
};

const { page } = useData();
const frontmatter = computed(() => page.value.frontmatter as HomeFrontmatter);
</script>

<template>
  <h1 class="text-6xl text-yellow-600 font-bold">{{ frontmatter.hero.name }}</h1>
  <p class="pt-4 text-2xl">{{ frontmatter.hero.text }}</p>

  <div class="pt-20 grid grid-cols-2 gap-4">
    <template v-for="feature in frontmatter.features">
      <article class="px-5 py-4 bg-taupe-200 rounded-lg">
        <h2 class="text-lg font-bold">{{ feature.title }}</h2>
        <p class="text-taupe-700">{{ feature.details }}</p>
      </article>
    </template>
  </div>

  <Content />
</template>
