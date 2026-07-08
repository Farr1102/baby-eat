<script setup lang="ts">
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import { showToast } from 'vant'
import { ref } from 'vue'
import { useGetApiEventLog, useGetApiEventLogDistinct } from '~/schemas/services/myAPI'

dayjs.locale('zh-cn')

const activeDate = ref(dayjs().format('YYYY-MM-DD'))
const activeEvent = ref<string>()
const showCalendar = ref(false)
const weekOffset = ref(0) // 0 = current, positive = past weeks

// Heatmap data
const heatmapData = ref<{ date: string; count: number }[]>([])
const maxCount = computed(() => Math.max(1, ...heatmapData.value.map(d => d.count)))

// Build weekly grid from heatmap data
interface WeekCell {
  date: string
  count: number
  level: number // 0-4 for color intensity
  dayOfWeek: number // 0=Sun ... 6=Sat
}

const weeks = computed<WeekCell[][]>(() => {
  const today = dayjs()
  // Go back weekOffset weeks, then show 20 weeks
  const endDate = today.subtract(weekOffset.value, 'week')
  const startDate = endDate.subtract(20, 'week')

  // Create a map of date -> count
  const countMap = new Map<string, number>()
  for (const d of heatmapData.value) {
    countMap.set(d.date, d.count)
  }

  // Generate all dates in range
  const result: WeekCell[][] = []
  let currentWeek: WeekCell[] = []

  const d = startDate.startOf('week') // Start on Sunday
  const end = endDate.endOf('week')

  while (d.isBefore(end)) {
    const dateStr = d.format('YYYY-MM-DD')
    const count = countMap.get(dateStr) || 0
    const level = count === 0 ? 0
      : count <= 2 ? 1
      : count <= 5 ? 2
      : count <= 10 ? 3
      : 4

    currentWeek.push({
      date: dateStr,
      count,
      level,
      dayOfWeek: d.day(), // 0=Sun
    })

    d.add(1, 'day')
    if (d.day() === 0 || d.isAfter(end)) {
      if (currentWeek.length > 0) result.push(currentWeek)
      currentWeek = []
    }
  }

  return result
})

// Fetch heatmap
async function fetchHeatmap() {
  try {
    const res = await fetch('/api/event-log/heatmap?weeks=20')
    if (res.ok) heatmapData.value = await res.json()
  } catch { /* ignore */ }
}
fetchHeatmap()

// color level
function heatColor(level: number, isSelected: boolean) {
  if (isSelected) return '#ec489a'
  return ['#ebedf0', '#fce4ec', '#f8bbd0', '#f48fb1', '#ec407a'][level]
}

// Week day labels
const dayLabels = ['日', '一', '二', '三', '四', '五', '六']

function selectCalendarDate(date: Date) {
  showCalendar.value = false
  activeDate.value = dayjs(date).format('YYYY-MM-DD')
}

// names / tags
const { data: tags, isPending: isFetchingTags, refetch: refetchTags } = useGetApiEventLogDistinct(
  computed(() => ({ date: activeDate.value })),
)

const { data: logs, isPending: isFetchingLogs, refetch: refetchLogs } = useGetApiEventLog(
  computed(() => ({ eventName: activeEvent.value, date: activeDate.value })),
)

const isRefreshing = ref(false)

function onRefresh(date?: string) {
  if (date) activeDate.value = date
  Promise.all([refetchTags(), refetchLogs(), fetchHeatmap()]).then(() => {
    isRefreshing.value = false
    showToast('刷新成功')
  })
}

defineExpose({ refresh: onRefresh })

watch(tags, () => {
  if (tags.value && !tags.value.find(e => e.eventName === activeEvent.value))
    activeEvent.value = undefined
})

const tagsWithAll = computed(() => {
  const totalCnt = tags.value?.reduce((acc, cur) => acc + cur.count, 0) || 0
  return [
    { displayName: '全部', eventName: undefined, count: totalCnt },
    ...(tags.value || []),
  ]
})

const isFetching = computed(() => isFetchingTags.value || isFetchingLogs.value)

// Stats
const currentTime = ref()

const nearLastFeed = computed(() => {
  const lastFeed = logs.value?.find(e => e.eventName === 'Feed')
  return lastFeed ? getDuration(lastFeed.eventTime!, currentTime.value) : '未知'
})

const nearLastDiaper = computed(() => {
  const lastDiaper = logs.value?.find(e => e.eventName === 'Diaper')
  return lastDiaper ? getDuration(lastDiaper.eventTime!, currentTime.value) : '未知'
})

const nearLastSleep = computed(() => {
  const lastSleep = logs.value?.find(e => e.eventName === 'Sleep')
  return lastSleep ? getDuration(lastSleep.eventTime!, currentTime.value) : '未知'
})

onMounted(() => {
  const interval = setInterval(() => { currentTime.value = new Date() }, 1000)
  onUnmounted(() => clearInterval(interval))
})

const hasFeedAD = computed(() => {
  return !!logs.value?.find(e => e.eventName === 'Supplement' && JSON.stringify(e.extra)?.includes('AD'))
})

const sleepTime = computed(() => {
  const sleepLogs = logs.value?.filter(e => e.eventName === 'Sleep')
  if (!sleepLogs?.length) return '0 小时 0 分钟'
  const minutes = sleepLogs.reduce((acc, cur) => {
    acc += dayjs(cur.extra?.endTime as any).diff(dayjs(cur.eventTime), 'minute')
    return acc
  }, 0)
  return `${Math.floor(minutes / 60)} 小时 ${minutes % 60} 分钟`
})

const weekLabel = computed(() => {
  if (weekOffset.value === 0) return '最近'
  return `${weekOffset.value} 周前`
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
        <!-- Heatmap -->
        <div overflow-hidden rounded-xl bg-white p-3>
          <div flex items-center justify-between mb-2>
            <van-icon name="arrow-left" size="16" @click="weekOffset++" />
            <span class="text-sm text-gray-5">{{ weekLabel }}</span>
            <van-icon
              name="arrow"
              size="16"
              :class="{ 'text-gray-3': weekOffset === 0 }"
              @click="weekOffset > 0 ? weekOffset-- : null"
            />
          </div>
          <div class="heatmap-wrapper">
            <!-- Day labels -->
            <div class="heatmap-row">
              <span class="day-label" />
              <template v-for="(week, wi) in weeks" :key="wi">
                <span class="cell-label">{{ dayjs(week[0]?.date).format('M/D') }}</span>
              </template>
            </div>
            <!-- 7 rows for Mon-Sun (actually Sun-Sat: 0-6) -->
            <div v-for="dayIdx in 7" :key="dayIdx" class="heatmap-row">
              <span class="day-label">{{ dayLabels[dayIdx - 1] }}</span>
              <template v-for="(week, wi) in weeks" :key="wi">
                <div
                  v-for="cell in week.filter(c => (dayIdx - 1 + 0) % 7 === c.dayOfWeek)"
                  :key="cell.date"
                  class="heat-cell"
                  :class="{ 'heat-cell--active': activeDate === cell.date }"
                  :style="{ backgroundColor: heatColor(cell.level, activeDate === cell.date) }"
                  :title="`${cell.date}: ${cell.count} 条记录`"
                  @click="activeDate = cell.date"
                />
                <!-- Fill gaps for weeks that don't have this day -->
                <div
                  v-if="!week.some(c => c.dayOfWeek === (dayIdx - 1))"
                  class="heat-cell opacity-0"
                />
              </template>
            </div>
          </div>
          <div flex items-center justify-end gap-1 pt-2 text-xs text-gray-4>
            <span>少</span>
            <span v-for="lvl in 5" :key="lvl" class="heat-cell inline-block" :style="{ backgroundColor: heatColor(lvl - 1, false) }" />
            <span>多</span>
          </div>
        </div>

        <!-- Stats -->
        <div v-if="!isFetching && !activeEvent" class="mt-3 px-2 text-xs">
          <div v-if="activeDate === dayjs().format('YYYY-MM-DD')">
            距离上次喂养: <span class="text-pink">{{ nearLastFeed }}</span> <br>
            距离上次换尿不湿: <span class="text-pink">{{ nearLastDiaper }}</span> <br>
            距离上次睡觉: <span class="text-pink">{{ nearLastSleep }}</span>
          </div>
          <div>AD 吃了没: <span class="text-pink">{{ hasFeedAD ? '吃了' : '没吃' }}</span></div>
          <div>今日总计睡眠时长: <span class="text-pink">{{ sleepTime }}</span></div>
        </div>

        <!-- Tag filters -->
        <div v-if="!!tags?.length" mt-2 flex flex-wrap>
          <van-tag
            v-for="event in tagsWithAll" :key="event.eventName"
            :text-color="event.eventName === activeEvent ? '#fff' : '#373737'"
            round
            class="mb-2 mr-2 !p-1 !px-2.5"
            :color="event.eventName === activeEvent ? '#ec489a' : '#eeeeee'"
            @click="activeEvent = event.eventName"
          >
            {{ event.displayName }} ({{ event.count }})
          </van-tag>
        </div>

        <!-- Event log cards -->
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
.heatmap-wrapper {
  overflow-x: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.heatmap-row {
  display: flex;
  align-items: center;
  gap: 2px;
}

.day-label {
  width: 20px;
  text-align: right;
  font-size: 10px;
  color: #999;
  flex-shrink: 0;
}

.cell-label {
  width: 14px;
  font-size: 9px;
  color: #bbb;
  text-align: center;
  flex-shrink: 0;
}

.heat-cell {
  width: 14px;
  height: 14px;
  border-radius: 2px;
  cursor: pointer;
  flex-shrink: 0;
  transition: transform 0.1s;

  &:hover {
    transform: scale(1.3);
  }

  &--active {
    transform: scale(1.3);
    box-shadow: 0 0 0 1px #fff, 0 0 0 2px #ec489a;
  }
}

.active-item {
  .van-grid-item__content {
    background-color: #ec489a;
    div { color: white; }
  }
}
</style>
