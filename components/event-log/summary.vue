<script setup lang="ts">
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import { showToast } from 'vant'
import { useGetApiEventLog, useGetApiEventLogDistinct } from '~/schemas/services/myAPI'

dayjs.locale('zh-cn')

const activeDate = ref(dayjs().format('YYYY-MM-DD'))
const activeEvent = ref<string>()
const showCalendar = ref(false)
const pageStart = ref(dayjs().subtract(12, 'week'))

// heatmap
const heatmapData = ref<{ date: string; count: number }[]>([])
const maxCount = computed(() => Math.max(1, ...heatmapData.value.map(d => d.count)))

async function fetchHeatmap() {
  try {
    const token = process.client ? localStorage.getItem('auth:token') : null
    const res = await fetch('/api/event-log/heatmap?weeks=20', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (res.ok) heatmapData.value = await res.json()
  } catch { /* ignore */ }
}
fetchHeatmap()

// Build a flat list of 7-col grid cells for 19 weeks
const heatCells = computed(() => {
  const countMap = new Map(heatmapData.value.map(d => [d.date, d.count]))
  const today = dayjs()
  // show 19 weeks before today
  const totalDays = 19 * 7
  const cells: { date: string; count: number; level: number; idx: number }[] = []

  for (let i = totalDays - 1; i >= 0; i--) {
    const d = today.subtract(i, 'day')
    const dateStr = d.format('YYYY-MM-DD')
    const count = countMap.get(dateStr) || 0
    const level = count === 0 ? 0 : count <= 2 ? 1 : count <= 5 ? 2 : count <= 10 ? 3 : 4
    cells.push({ date: dateStr, count, level, idx: totalDays - 1 - i })
  }
  return cells
})

function heatColor(level: number): string {
  return ['#ebedf0', '#fce4ec', '#f8bbd0', '#f48fb1', '#ec407a'][level]
}

function selectCalendarDate(date: Date) {
  showCalendar.value = false
  activeDate.value = dayjs(date).format('YYYY-MM-DD')
}

// tags
const { data: tags, isPending: isFetchingTags, refetch: refetchTags } = useGetApiEventLogDistinct(
  computed(() => ({ date: activeDate.value })),
)
const { data: logs, isPending: isFetchingLogs, refetch: refetchLogs } = useGetApiEventLog(
  computed(() => ({ eventName: activeEvent.value, date: activeDate.value })),
)

const isRefreshing = ref(false)

function onRefresh(date?: string) {
  if (date) activeDate.value = date
  Promise.all([refetchTags(), refetchLogs(), fetchHeatmap()]).finally(() => {
    isRefreshing.value = false
  })
}

defineExpose({ refresh: onRefresh })

watch(tags, () => {
  if (tags.value && !tags.value.find(e => e.eventName === activeEvent.value))
    activeEvent.value = undefined
})

const tagsWithAll = computed(() => {
  const totalCnt = tags.value?.reduce((acc, cur) => acc + cur.count, 0) || 0
  return [{ displayName: '全部', eventName: undefined, count: totalCnt }, ...(tags.value || [])]
})

const isFetching = computed(() => isFetchingTags.value || isFetchingLogs.value)

const currentTime = ref()
const nearLastFeed = computed(() => {
  const r = logs.value?.find(e => e.eventName === 'Feed')
  return r ? getDuration(r.eventTime!, currentTime.value) : '未知'
})
const nearLastDiaper = computed(() => {
  const r = logs.value?.find(e => e.eventName === 'Diaper')
  return r ? getDuration(r.eventTime!, currentTime.value) : '未知'
})
const nearLastSleep = computed(() => {
  const r = logs.value?.find(e => e.eventName === 'Sleep')
  return r ? getDuration(r.eventTime!, currentTime.value) : '未知'
})
onMounted(() => {
  const i = setInterval(() => { currentTime.value = new Date() }, 1000)
  onUnmounted(() => clearInterval(i))
})

const hasFeedAD = computed(() =>
  !!logs.value?.find(e => e.eventName === 'Supplement' && JSON.stringify(e.extra)?.includes('AD')))
const sleepTime = computed(() => {
  const sl = logs.value?.filter(e => e.eventName === 'Sleep')
  if (!sl?.length) return '0 小时 0 分钟'
  const min = sl.reduce((a, c) => a + dayjs(c.extra?.endTime as any).diff(dayjs(c.eventTime), 'minute'), 0)
  return `${Math.floor(min / 60)} 小时 ${min % 60} 分钟`
})

const dayLabels = ['一', '二', '三', '四', '五', '六', '日']

const labelRow = computed(() => {
  const cols = []
  for (let i = 0; i < 19; i++) {
    const d = dayjs().subtract(19 - 1 - i, 'week').startOf('week').add(1, 'day')
    cols.push(d.format('M/D'))
  }
  return cols
})
</script>

<template>
  <div bg="#f5f5f5" h-full w-full overflow-auto pb-13>
    <van-nav-bar title="事件记录" class="mb-4">
      <template #right>
        <van-icon name="calendar-o" size="20" @click="showCalendar = true" />
      </template>
    </van-nav-bar>
    <van-calendar
      v-model:show="showCalendar"
      :max-date="new Date()"
      @confirm="({ date }: any) => selectCalendarDate(date)"
    />
    <van-pull-refresh v-model="isRefreshing" class="overflow-visible" @refresh="onRefresh">
      <div class="px-4">
        <!-- heatmap -->
        <div overflow-hidden rounded-xl bg-white p-3>
          <div class="heatmap-grid" :style="{ gridTemplateColumns: `16px repeat(${19}, 1fr)` }">
            <!-- top labels -->
            <div class="text-9px text-gray-3 text-right pr-1" />
            <div
              v-for="(lb, i) in labelRow"
              :key="i"
              class="text-9px text-gray-3"
            >{{ lb }}</div>

            <!-- day rows -->
            <template v-for="row in 7" :key="row">
              <div class="text-9px text-gray-4 text-right pr-1">{{ dayLabels[row - 1] }}</div>
              <div
                v-for="(cell, ci) in heatCells.filter((_, i) => i % 7 === row - 1)"
                :key="ci"
                class="heat-cell"
                :class="{ 'heat-cell--active': activeDate === cell.date }"
                :style="{ backgroundColor: heatColor(cell.level) }"
                :title="`${cell.date}: ${cell.count}`"
                @click="activeDate = cell.date"
              />
            </template>
          </div>
        </div>

        <!-- stats -->
        <div v-if="!isFetching && !activeEvent" class="mt-3 px-2 text-xs">
          <div v-if="activeDate === dayjs().format('YYYY-MM-DD')">
            距离上次喂养: <span class="text-pink">{{ nearLastFeed }}</span> <br>
            距离上次换尿不湿: <span class="text-pink">{{ nearLastDiaper }}</span> <br>
            距离上次睡觉: <span class="text-pink">{{ nearLastSleep }}</span>
          </div>
          <div>AD 吃了没: <span class="text-pink">{{ hasFeedAD ? '吃了' : '没吃' }}</span></div>
          <div>今日总计睡眠时长: <span class="text-pink">{{ sleepTime }}</span></div>
        </div>

        <!-- tags -->
        <div v-if="!!tags?.length" mt-2 flex flex-wrap>
          <van-tag
            v-for="event in tagsWithAll" :key="event.eventName"
            :text-color="event.eventName === activeEvent ? '#fff' : '#373737'"
            round class="mb-2 mr-2 !p-1 !px-2.5"
            :color="event.eventName === activeEvent ? '#ec489a' : '#eeeeee'"
            @click="activeEvent = event.eventName"
          >
            {{ event.displayName }} ({{ event.count }})
          </van-tag>
        </div>

        <!-- event cards -->
        <div v-if="!isFetching" grid grid-cols-2 mb-2 gap-2>
          <template v-for="log in logs" :key="log.id">
            <event-log-detail :event-log="log" />
          </template>
        </div>
        <van-loading v-if="isFetching" color="#ec489a" vertical mt-4>加载中...</van-loading>
        <van-empty v-else-if="!logs?.length" description="当天没有记录哦～" />
      </div>
    </van-pull-refresh>
  </div>
</template>

<style lang="scss">
.heatmap-grid {
  display: grid;
  gap: 2px;
  align-items: center;
}

.heat-cell {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  cursor: pointer;
  flex-shrink: 0;
  transition: transform 0.1s;
  &:hover { transform: scale(1.3); }
}

.heat-cell--active {
  transform: scale(1.3);
  box-shadow: 0 0 0 1px #fff, 0 0 0 2px #ec489a;
}
</style>
