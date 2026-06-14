<script setup lang="ts">
defineProps<{
  files: string[];
  currentFile: string | null;
}>();

const emit = defineEmits<{
  "open-new-dialog": [];
}>();
</script>

<template>
  <div class="overflow-y-auto shrink-0">
    <div
      class="flex items-center px-3 py-1 text-xs font-semibold text-slate-300 uppercase tracking-wider"
    >
      Markdown
      <button
        class="ml-auto text-slate-300 text-base leading-none p-0.5 w-5 h-5 rounded-sm hover:bg-slate-800"
        title="新規作成"
        @click="emit('open-new-dialog')"
      >
        +
      </button>
    </div>
    <ul class="py-1">
      <li
        v-for="f in files"
        :key="f"
        class="text-xs"
        :class="f === currentFile ? 'bg-teal-900 text-white' : 'text-slate-300 hover:bg-slate-800'"
      >
        <a
          class="block px-3 py-1 select-none whitespace-nowrap overflow-hidden text-ellipsis"
          :href="`/__fumi/editor?path=${f}`"
          :aria-current="f === currentFile ? 'page' : undefined"
          >{{ f }}</a
        >
      </li>
    </ul>
  </div>
</template>
