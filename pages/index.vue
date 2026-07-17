<script setup lang="ts">
import { ref } from 'vue'

const summaryRef = ref<{
  refresh: (eventTime: string) => Promise<void>
}>(null!)
</script>

<template>
  <div class="relative h-full w-full">
    <event-log-summary ref="summaryRef" />
    <event-log-dispatch @success="summaryRef?.refresh" />
  </div>
</template>
