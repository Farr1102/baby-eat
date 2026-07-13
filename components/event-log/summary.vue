<script setup lang="ts">
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import { showToast } from 'vant'
import { useGetApiBabyId, useGetApiEventLog, useGetApiEventLogDistinct } from '~/schemas/services/myAPI'

dayjs.locale('zh-cn')

const { data: baby } = useGetApiBabyId('1')

// Baby age
const babyAge = computed(() => {
  if (!baby.value?.bornAt) return ''
  const born = dayjs(baby.value.bornAt)
  const now = dayjs()
  const days = now.diff(born, 'day')
  if (days <= 100) return `${days} 天`
  const months = now.diff(born, 'month')
  if (days <= 365) {
    const remDays = now.diff(born.add(months, 'month'), 'day')
    return `${months} 个月 ${remDays} 天`
  }
  const years = now.diff(born, 'year')
  const remMonths = months - years * 12
  return remMonths > 0 ? `${years} 岁 ${remMonths} 个月` : `${years} 岁`
})

// Milestone dates
const MILESTONE_LIST: { days: number; label: string; emoji: string }[] = [
  { days: 0, label: '出生啦', emoji: '🧨' },
  { days: 7, label: '一周', emoji: '🎂' },
  { days: 14, label: '两周', emoji: '⭐' },
  { days: 30, label: '满月', emoji: '🌕' },
  { days: 100, label: '百天', emoji: '💯' },
  { days: 180, label: '六个月', emoji: '📅' },
  { days: 365, label: '一岁', emoji: '🎂' },
  { days: 730, label: '两岁', emoji: '🎂' },
  { days: 1095, label: '三岁', emoji: '🎂' },
]

const milestones = computed(() => {
  if (!baby.value?.bornAt) return new Map<string, string>()
  const born = dayjs(baby.value.bornAt)
  const map = new Map<string, string>()
  for (const m of MILESTONE_LIST) {
    map.set(born.add(m.days, 'day').format('YYYY-MM-DD'), `${m.emoji} ${m.label}`)
  }
  return map
})

const activeDate = ref(dayjs().format('YYYY-MM-DD'))
const activeEvent = ref<string>()

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
  if (!r) return '未知'
  const t = (r.extra as any)?.endTime || r.eventTime
  return getDuration(t, currentTime.value)
})
const nearLastDiaper = computed(() => {
  const r = logs.value?.find(e => e.eventName === 'Diaper')
  return r ? getDuration(r.eventTime!, currentTime.value) : '未知'
})
const nearLastSleep = computed(() => {
  const r = logs.value?.find(e => e.eventName === 'Sleep')
  if (!r) return '未知'
  const t = (r.extra as any)?.endTime || r.eventTime
  return getDuration(t, currentTime.value)
})

// Today's sleep events
const todayLogs = computed(() => {
  return logs.value?.filter(e =>
    dayjs(e.eventTime).format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD')
  ) || []
})

const sleepTime = computed(() => {
  const sl = todayLogs.value.filter(e => e.eventName === 'Sleep')
  if (!sl.length) return '0 小时 0 分钟'
  const min = sl.reduce((a, c) => {
    const end = (c.extra as any)?.endTime
    if (!end) return a
    return a + dayjs(end).diff(dayjs(c.eventTime), 'minute')
  }, 0)
  return `${Math.floor(min / 60)} 小时 ${min % 60} 分钟`
})

onMounted(() => {
  const i = setInterval(() => { currentTime.value = new Date() }, 1000)
  onUnmounted(() => clearInterval(i))
})

const hasFeedAD = computed(() =>
  !!logs.value?.find(e => e.eventName === 'Supplement' && (e.extra as any)?.taken === '是'))

const dayLabels = ['一', '二', '三', '四', '五', '六', '日']

const labelRow = computed(() => {
  const cols: string[] = []
  let lastMonth = ''
  for (let w = 18; w >= 0; w--) {
    const m = dayjs().subtract(w, 'week').format('M月')
    if (m !== lastMonth) {
      cols.push(m)
      lastMonth = m
    } else {
      cols.push('')
    }
  }
  return cols
})
</script>

<template>
  <div h-full w-full overflow-auto pb-16 style="background: var(--app-bg)">
    <van-nav-bar title="事件记录" class="summary-nav glass-strong !sticky top-0 z-20" />
    <div class="pt-3 text-center text-sm font-medium" style="color: var(--app-ink-2)">
      {{ dayjs(activeDate).format('YYYY年M月D日 dddd') }}
      <span
        v-if="activeDate !== dayjs().format('YYYY-MM-DD')"
        class="ml-2 text-xs text-pink cursor-pointer"
        @click="activeDate = dayjs().format('YYYY-MM-DD')"
      >回到今天</span>
    </div>
    <div v-if="babyAge" class="mt-1 text-center text-xs text-pink font-medium">
      {{ baby?.name }} · {{ babyAge }}
      <span v-if="milestones.get(activeDate)" class="text-green-600"> · {{ milestones.get(activeDate) }}</span>
    </div>
    <van-pull-refresh v-model="isRefreshing" class="overflow-visible" @refresh="onRefresh">
      <div class="px-4 pt-3">
        <!-- heatmap -->
        <div overflow-hidden card p-3>
          <div class="heatmap-grid">
            <!-- top labels -->
            <div />
            <div
              v-for="(lb, i) in labelRow"
              :key="i"
              class="text-8px text-gray-3 text-center"
            >{{ lb }}</div>

            <!-- day rows -->
            <template v-for="row in 7" :key="row">
              <div class="text-8px text-gray-4 text-right pr-1">{{ dayLabels[row - 1] }}</div>
              <div
                v-for="(cell, ci) in heatCells.filter((_, i) => i % 7 === (row - 1) % 7)"
                :key="ci"
                class="heat-cell"
                :class="{ 'heat-cell--active': activeDate === cell.date }"
                :style="{ backgroundColor: heatColor(cell.level) }"
                :title="`${cell.date}: ${cell.count}${milestones.get(cell.date) ? ' · ' + milestones.get(cell.date) : ''}`"
                @click="activeDate = cell.date"
              >
                <div
                  v-if="milestones.get(cell.date)"
                  class="milestone-dot"
                />
              </div>
            </template>
          </div>
        </div>

        <!-- stats -->
        <div v-if="!isFetching && !activeEvent" class="mt-3">
          <div v-if="activeDate === dayjs().format('YYYY-MM-DD')" class="grid grid-cols-3 gap-2">
            <div class="stat-tile card">
              <div class="stat-label">距上次喂养</div>
              <div class="stat-value">{{ nearLastFeed }}</div>
            </div>
            <div class="stat-tile card">
              <div class="stat-label">距上次换尿布</div>
              <div class="stat-value">{{ nearLastDiaper }}</div>
            </div>
            <div class="stat-tile card">
              <div class="stat-label">距上次睡觉</div>
              <div class="stat-value">{{ nearLastSleep }}</div>
            </div>
          </div>
          <div class="mt-2 grid grid-cols-2 gap-2">
            <div class="stat-tile card">
              <div class="stat-label">今日总睡眠</div>
              <div class="stat-value">{{ sleepTime }}</div>
            </div>
            <div class="stat-tile card">
              <div class="stat-label">AD 补充</div>
              <div class="stat-value" :class="hasFeedAD ? 'text-green-600' : ''">
                {{ hasFeedAD ? '已补充 ✓' : '未补充' }}
              </div>
            </div>
          </div>
        </div>

        <!-- tags -->
        <div v-if="!!tags?.length" mt-3 flex flex-wrap>
          <van-tag
            v-for="event in tagsWithAll" :key="event.eventName"
            :text-color="event.eventName === activeEvent ? '#fff' : '#373737'"
            round class="filter-tag mb-2 mr-2 !py-1.5 !px-3 !text-xs"
            :color="event.eventName === activeEvent ? '#ec489a' : '#ffffff'"
            @click="activeEvent = event.eventName"
          >
            {{ event.displayName }} ({{ event.count }})
          </van-tag>
        </div>

        <!-- event cards -->
        <div v-if="!isFetching" grid grid-cols-2 mb-2 mt-1 gap-2.5>
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
.summary-nav {
  :deep(.van-nav-bar__title) {
    letter-spacing: -0.01em;
  }
}

.stat-tile {
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.stat-label {
  font-size: 11px;
  color: var(--app-ink-3);
  letter-spacing: 0.01em;
}
.stat-value {
  font-size: 14px;
  font-weight: 650;
  letter-spacing: -0.01em;
  color: var(--app-ink);
}

.filter-tag {
  box-shadow: 0 1px 2px rgba(20, 20, 36, 0.06);
  transition: transform 0.15s ease-out;
  &:active {
    transform: scale(0.94);
  }
}

.heatmap-grid {
  display: grid;
  grid-template-columns: 16px repeat(19, 1fr);
  gap: 2px;
  align-items: center;
  width: 100%;
}

.heat-cell {
  aspect-ratio: 1;
  border-radius: 2px;
  cursor: pointer;
  flex-shrink: 0;
  position: relative;
}

.milestone-dot {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #22c55e;
  pointer-events: none;
}

.heat-cell--active {
  box-shadow: inset 0 0 0 2px #333;
}
</style>
