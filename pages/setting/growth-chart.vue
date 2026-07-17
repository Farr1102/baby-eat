<script setup lang="ts">
import { Chart } from '@antv/g2'
import dayjs from 'dayjs'
import { groupBy } from 'lodash-es'
import { useGetApiEventLog } from '~/schemas/services/myAPI'

const router = useRouter()

const { data, suspense } = useGetApiEventLog()

onServerPrefetch(suspense)

const active = ref(0)
const colorMode = useColorMode()
const tabTitles = ['Day', 'Week', 'Month', 'Year']

const chart_data = computed(() => {
  if (!data.value)
    return []

  const diaper = data.value?.filter(item => item.eventName === 'Diaper')
  const grouped = groupBy(diaper, (item) => {
    // day
    if (active.value === 0)
      return dayjs(item.eventTime).diff('2023-10-05', 'day')
    // week
    if (active.value === 1)
      return dayjs(item.eventTime).diff('2023-10-05', 'week')
    // month
    if (active.value === 2)
      return dayjs(item.eventTime).format('YYYY-MM')
    // year
    if (active.value === 3)
      return dayjs(item.eventTime).format('YYYY')
  })
  return Object.entries(grouped).map(([key, value]) => {
    return {
      label: key,
      count: value.length,
    }
  }).sort((a, b) => {
    if (active.value === 1 || active.value === 0)
      return Number(a.label) - Number(b.label)

    return a.label.localeCompare(b.label)
  })
})
const container = ref<HTMLElement>(null!)
onMounted(async () => {
  watchEffect((onCleanup) => {
    const chart = new Chart({
      container: container.value,
      autoFit: true,
      theme: colorMode.value === 'dark' ? 'classicDark' : 'classic',
    })
    // 直方图
    chart
      .interval()
      .data(chart_data.value)
      .encode('x', 'label')
      .encode('y', 'count')
      .axis('x', {
        title: false,
        label: false,
      })
      .axis('y', {
        title: false,
      })
      .style({
        radiusTopLeft: 4,
        radiusTopRight: 4,
      })
    chart.render()
    onCleanup(() => {
      chart.destroy()
    })
  })
})
</script>

<template>
  <div class="h-full overflow-auto pb-16" style="background: var(--app-bg)">
    <van-nav-bar
      title="统计"
      left-arrow
      class="glass-strong !sticky top-0 z-20"
      @click-left="router.back"
    />
    <div class="flex flex-wrap gap-2 px-4 pt-4">
      <span
        v-for="(t, i) in tabTitles"
        :key="t"
        class="seg-tag"
        :class="active === i ? 'seg-tag--active' : ''"
        @click="active = i"
      >
        {{ t }}
      </span>
    </div>
    <div ref="container" />
  </div>
</template>

<style scoped lang="scss">
.seg-tag {
  padding: 6px 16px;
  border-radius: 999px;
  font-size: 13px;
  cursor: pointer;
  background: var(--app-surface);
  color: var(--app-ink-2);
  box-shadow: 0 1px 2px rgba(20, 20, 36, 0.06);
  transition: transform var(--dur-press) var(--ease-out), background-color var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out);
  &:active {
    transform: scale(0.94);
  }
}
.seg-tag--active {
  background: var(--app-accent);
  color: #fff;
}
</style>
