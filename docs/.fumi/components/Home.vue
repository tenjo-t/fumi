<script lang="ts" setup>
import { Content, useData } from "@tenjot/fumi/client";
import { computed } from "vue";

type Frontmatter = {
  hero: {
    name: string;
    text: string;
  };
  features: {
    title: string;
    details: string;
  }[];
  actions: {
    text: string;
    link: string;
  }[];
};

const { page } = useData();
const frontmatter = computed(() => page.value.frontmatter as Frontmatter);
</script>

<template>
  <h1 class="text-5xl text-yellow-700 font-bold">{{ frontmatter.hero.name }}</h1>
  <p class="pt-4 text-xl text-taupe-500">{{ frontmatter.hero.text }}</p>

  <div class="pt-10 flex gap-4">
    <template v-for="(action, i) in frontmatter.actions">
      <a
        :href="action.link"
        class="block px-6 py-2 rounded-full transition-all"
        :class="
          i === 0
            ? 'text-white bg-yellow-700 hover:bg-yellow-800 focus:bg-yellow-800 active:bg-yellow-900'
            : 'bg-taupe-200 hover:bg-taupe-300 focus:bg-taupe-300 active:bg-taupe-400'
        "
      >
        {{ action.text }}
      </a>
    </template>
  </div>

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
