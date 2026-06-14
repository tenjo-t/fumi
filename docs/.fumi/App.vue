<script lang="ts" setup>
import { Content, useData } from "@tenjot/fumi/client";
import Header from "./components/Header.vue";
import Home from "./components/Home.vue";
import Doc from "./components/Doc.vue";
const { page } = useData();
</script>

<template>
  <div class="max-w-3xl mx-auto">
    <Header />
    <main class="p-8">
      <template v-if="page.frontmatter?.layout === 'home'">
        <Home />
      </template>
      <template v-else>
        <Doc />
      </template>
    </main>
    <footer class="p-4 text-sm text-center border-t border-taupe-300">© Tenjo, takashi</footer>
  </div>
</template>

<style>
@import "tailwindcss";
@source "index.html";
@source "**/*.md";
</style>
