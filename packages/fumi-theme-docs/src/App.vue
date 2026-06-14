<script lang="ts" setup>
import { Content, useData } from "@tenjot/fumi/client";
import Home from "./Home.vue";
import NotFound from "./NotFound.vue";
const { page } = useData();
</script>

<template>
  <header class="p-4"><a href="/">Fumi</a></header>
  <main class="p-8">
    <template v-if="page.isNotFound">
      <NotFound />
    </template>
    <template v-if="page.frontmatter?.layout === 'home'">
      <Home />
    </template>
    <template v-else>
      <Content />
    </template>
  </main>
  <footer class="p-4 text-sm text-center border-t border-taupe-300">© Tenjo, takashi</footer>
</template>

<style>
@import "tailwindcss";
@source "index.html";
</style>
