<script lang="ts" setup>
import { useRoute } from "./router";

const route = useRoute();
</script>

<template>
  <component v-if="route.component" :is="route.component" />
</template>
