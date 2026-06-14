<script setup lang="ts">
defineProps<{
  src: string;
}>();
</script>

<template>
  <iframe class="w-full h-full" :src="src"></iframe>
</template>
