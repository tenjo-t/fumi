<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  currentFile: string | null;
  currentTab: "editor" | "preview";
  saved: boolean;
  sidebarWidth: number;
}>();

const emit = defineEmits<{
  "switch-tab": [tab: "editor" | "preview"];
  save: [];
}>();

const fileLabel = computed(() => {
  if (!props.currentFile) return "ファイルを選択してください";
  return props.saved ? props.currentFile : props.currentFile + " *";
});
</script>

<template>
  <div
    class="px-3 grid gap-2 items-center shrink-0"
    :style="{ 'grid-template-columns': `${sidebarWidth - 12}px 1fr 4rem 4rem 4rem` }"
  >
    <div></div>
    <div class="text-xs text-slate-200">{{ fileLabel }}</div>
    <button
      class="px-4 py-1 text-white text-xs rounded-sm select-none enabled:bg-teal-700 enabled:hover:bg-teal-800 disabled:bg-slate-800 disabled:text-slate-300 disabled:cursor-default"
      :disabled="!currentFile"
      @click="emit('save')"
    >
      Save
    </button>
    <button
      class="px-4 pb-1 pt-2 border-b-2 text-xs select-none"
      :class="
        currentTab === 'editor'
          ? 'border-teal-500'
          : 'border-transparent text-slate-300 hover:text-slate-200'
      "
      @click="emit('switch-tab', 'editor')"
    >
      Editor
    </button>
    <button
      class="px-4 pb-1 pt-2 border-b-2 text-xs select-none"
      :class="
        currentTab === 'preview'
          ? 'border-teal-500'
          : 'border-transparent text-slate-300 hover:text-slate-200'
      "
      @click="emit('switch-tab', 'preview')"
    >
      Preview
    </button>
  </div>
</template>
