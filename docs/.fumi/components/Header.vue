<script lang="ts" setup>
import { data as guide } from "../guide.data";
import { data as reference } from "../reference.data";
</script>

<template>
  <header class="p-4 flex justify-between">
    <a href="/">Fumi</a>
    <div>
      <button
        class="px-2 py-1 rounded hover:bg-taupe-200 focus:bg-taupe-200 active:bg-taupe-300 transition-colors select-none"
        type="button"
        command="show-modal"
        commandfor="menu"
      >
        MENU
      </button>
    </div>
  </header>
  <dialog
    id="menu"
    class="w-dvw h-dvh max-w-full max-h-full overflow-y-auto bg-taupe-100 text-taupe-800"
  >
    <div class="mx-auto p-4 max-w-3xl flex justify-between">
      <a href="/">Fumi</a>
      <button
        class="px-2 py-1 rounded hover:bg-taupe-200 focus:bg-taupe-200 active:bg-taupe-300 transition-colors select-none"
        command="close"
        commandfor="menu"
        autofocus
      >
        Close
      </button>
    </div>
    <nav class="max-w-lg mx-auto px-4">
      <div class="py-4 font-bold text-taupe-700 border-t border-taupe-300">ガイド</div>
      <ul class="pb-4">
        <template v-for="article of guide">
          <li>
            <a
              class="py-1 block text-taupe-600 hover:text-yellow-800 focus:text-yellow-800 active:text-yellow-900 transition-colors"
              :href="article.path"
            >
              {{ article.title }}
            </a>
          </li>
        </template>
      </ul>
      <div class="py-4 font-bold border-t border-taupe-300">リファレンス</div>
      <ul class="pb-4">
        <template v-for="article of reference">
          <li>
            <a
              class="py-1 block text-taupe-600 hover:text-yellow-800 focus:text-yellow-800 active:text-yellow-900 transition-colors"
              :href="article.path"
            >
              {{ article.title }}
            </a>
          </li>
        </template>
      </ul>
    </nav>
    <div class="max-w-lg mx-auto py-4 flex justify-center gap-4 border-t border-taupe-300">
      <a href="">GitHub</a>
    </div>
  </dialog>
</template>

<style>
html:has(:modal) {
  overflow-y: hidden;
  scrollbar-gutter: stable;
}
</style>
