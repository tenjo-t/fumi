<script setup lang="ts">
import { ref, nextTick } from "vue";

const emit = defineEmits<{
  create: [path: string];
}>();

const dialogEl = ref<HTMLDialogElement | null>(null);
const inputEl = ref<HTMLInputElement | null>(null);
const newPath = ref("");

function open() {
  newPath.value = "";
  dialogEl.value?.showModal();
  nextTick(() => inputEl.value?.focus());
}

function close() {
  dialogEl.value?.close();
}

function submit() {
  const path = newPath.value.trim();
  if (!path) return;
  emit("create", path.endsWith(".md") ? path : path + ".md");
}

defineExpose({ open, close });
</script>

<template>
  <dialog
    ref="dialogEl"
    class="bg-slate-900 text-slate-100 border border-slate-700 rounded-md m-auto p-6 min-w-80 shadow-sm/100"
  >
    <h2 class="text-sm mb-3">新規記事</h2>
    <label class="block text-xs mb-1" for="dialog-path-input">ファイルパス</label>
    <input
      id="dialog-path-input"
      ref="inputEl"
      v-model="newPath"
      class="w-full px-3 py-1 bg-slate-800 border border-slate-700 rounded-sm text-xs outline-none focus:border-teal-500"
      type="text"
      placeholder="my-post.md"
      @keydown.enter="submit"
      @keydown.escape="close"
    />
    <p class="text-xs text-slate-300 mt-1">プロジェクトルートからの相対パス（.md）</p>
    <div class="flex justify-end gap-2 mt-4">
      <button
        class="px-3 py-1 bg-slate-800 rounded-sm cursor-pointer text-xs select-none hover:bg-slate-700"
        @click="close"
      >
        キャンセル
      </button>
      <button
        class="px-3 py-1 bg-teal-700 text-white rounded-sm cursor-pointer text-xs select-none hover:bg-teal-800"
        @click="submit"
      >
        作成
      </button>
    </div>
  </dialog>
</template>
