<script setup lang="ts">
import { ref } from 'vue'
import type { Event } from '~/schemas/model'
import { useGetApiEvent } from '~/schemas/services/myAPI'

const emit = defineEmits<{
  (event: 'success', time: string): void
}>()

const showPopover = ref(false)
const showFormPopup = ref(false)

const { data: events, suspense } = useGetApiEvent()

const selectedEvent = ref<Event>()

async function showEventLogCreateForm(event: Event) {
  showPopover.value = false
  selectedEvent.value = event
  showFormPopup.value = true
}

onServerPrefetch(suspense)
</script>

<template>
  <div absolute bottom-16 right-4>
    <van-popover v-model:show="showPopover" class="dispatch-popover !overflow-visible !rounded-2xl" placement="top-end">
      <van-grid
        clickable
        square
        :border="false"
        column-num="3"
        class="w-330px"
      >
        <van-grid-item
          v-for="event in events"
          :key="event.displayName"
          class="dispatch-grid-item"
          @click="showEventLogCreateForm(event)"
        >
          <div class="flex justify-center">
            <Icon :preview-disabled="true" class="!w-8 !h-8" :name="event.icon" />
          </div>
          <span class="whitespace-nowrap pt-1 text-xs" style="color: var(--app-ink-2)">
            {{ event.displayName }}
          </span>
        </van-grid-item>
      </van-grid>
      <template #reference>
        <div
          class="fab h-14 w-14 flex items-center justify-center rounded-full"
          :class="{ 'fab--open': showPopover }"
        >
          <van-icon name="plus" :size="30" color="#fff" />
        </div>
      </template>
    </van-popover>
    <event-log-form
      v-model:show="showFormPopup"
      :event="selectedEvent"
      @success="(time) => {
        emit('success', time)
      }"
    />
  </div>
</template>

<style scoped>
.fab {
  background: linear-gradient(135deg, #ff6fb0 0%, #ec489a 100%);
  box-shadow: 0 6px 20px -4px rgba(236, 72, 154, 0.55), 0 2px 6px rgba(0, 0, 0, 0.12);
  transition: transform 0.35s var(--ease-spring), box-shadow var(--dur-fast) var(--ease-out);
}
.fab:active {
  transform: scale(0.95);
}
.fab--open {
  transform: rotate(45deg);
}
.fab--open:active {
  transform: rotate(45deg) scale(0.95);
}

.dispatch-grid-item :deep(.van-grid-item__content) {
  border-radius: 14px;
  transition: transform var(--dur-press) var(--ease-out), background-color var(--dur-press) var(--ease-out);
}
.dispatch-grid-item :deep(.van-grid-item__content:active) {
  transform: scale(0.94);
  background-color: rgba(236, 72, 154, 0.08);
}
</style>

<style>
.dispatch-popover {
  --van-popover-light-background: rgba(255, 255, 255, 0.72);
}
.dispatch-popover .van-popover__content {
  border-radius: 16px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  transform-origin: bottom right;
  box-shadow: 0 12px 40px -8px rgba(20, 20, 36, 0.28);
}
.dispatch-popover .van-grid-item__content {
  background: transparent;
}
html.dark .dispatch-popover {
  --van-popover-light-background: rgba(28, 28, 30, 0.72);
}
html.dark .dispatch-popover .van-popover__content {
  background: rgba(28, 28, 30, 0.72);
  box-shadow: 0 12px 40px -8px rgba(0, 0, 0, 0.6);
}
</style>
