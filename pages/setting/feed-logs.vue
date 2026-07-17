<script setup lang="ts">
import { ref } from 'vue'
import { useGetApiEventLog, useGetApiEventLogDistinct } from '~/schemas/services/myAPI'

const { data: tags, suspense: suspenseTags } = useGetApiEventLogDistinct(
)
const { data: logs, suspense: suspenseLogs } = useGetApiEventLog()

onServerPrefetch(async () => {
  return Promise.all([suspenseTags(), suspenseLogs()])
})

const activeEvent = ref<string>()
watch(tags, () => {
  if (tags.value && !tags.value.find(e => e.eventName === activeEvent.value))
    activeEvent.value = undefined
})

const tagsWithAll = computed(() => {
  const totalCnt = tags.value?.reduce((acc, cur) => acc + cur.count, 0) || 0
  return [
    {
      displayName: '全部',
      eventName: undefined,
      count: totalCnt,
    },
    ...(tags.value || []),
  ]
})
const router = useRouter()
</script>

<template>
  <div class="h-full overflow-auto" style="background: var(--app-bg)">
    <van-nav-bar
      title="喂养记录"
      left-arrow
      class="glass-strong !sticky top-0 z-20"
      @click-left="router.back"
    />
    <div v-if="!!tags?.length" class="flex flex-wrap px-4 pt-4">
      <van-tag
        v-for="event in tagsWithAll" :key="event.eventName"
        round
        class="filter-tag mb-2 mr-2 !py-1.5 !px-3 !text-xs"
        :class="event.eventName === activeEvent ? 'filter-tag--active' : ''"
        @click="activeEvent = event.eventName"
      >
        {{ event.displayName }} ({{ event.count }})
      </van-tag>
    </div>
    <div v-for="log in logs" :key="log.id" class="m-2">
      <event-log-detail :event-log="log" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.filter-tag {
  background: var(--app-surface) !important;
  color: var(--app-ink-2) !important;
  box-shadow: 0 1px 2px rgba(20, 20, 36, 0.06);
  transition: transform var(--dur-press) var(--ease-out);
  &:active {
    transform: scale(0.94);
  }
}
.filter-tag--active {
  background: var(--app-accent) !important;
  color: #fff !important;
}

html.dark .filter-tag {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
}
</style>
