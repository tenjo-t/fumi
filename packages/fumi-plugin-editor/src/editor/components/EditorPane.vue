<script setup lang="ts">
defineProps<{
  modelValue: string;
  disabled: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
  dirty: [];
}>();
</script>

<template>
  <textarea
    class="w-full h-full bg-slate-800 px-4 py-2 font-mono text-sm resize-none outline-none tab-2"
    :value="modelValue"
    :disabled="disabled"
    placeholder="ファイルを選択してください"
    @input="
      (e) => {
        emit('update:modelValue', (e.target as HTMLTextAreaElement).value);
        emit('dirty');
      }
    "
  ></textarea>
</template>
