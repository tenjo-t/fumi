<script setup lang="ts">
import { computed } from "vue";
import EditorPane from "./EditorPane.vue";
import PreviewPane from "./PreviewPane.vue";

const props = defineProps<{
  content: string;
  currentFile: string | null;
  currentTab: "editor" | "preview";
  previewSrc: string;
}>();

const emit = defineEmits<{
  "update:content": [value: string];
  dirty: [];
  "switch-tab": [tab: "editor" | "preview"];
}>();
</script>

<template>
  <div
    class="w-full overflow-hidden border-t border-l border-slate-700 shadow-sm/100 rounded-tl-lg"
  >
    <EditorPane
      v-show="currentTab === 'editor'"
      :model-value="content"
      :disabled="!currentFile"
      @update:model-value="emit('update:content', $event)"
      @dirty="emit('dirty')"
    />
    <PreviewPane v-show="currentTab === 'preview'" :src="previewSrc" />
  </div>
</template>
