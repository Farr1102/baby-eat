<script setup lang="ts">
import dayjs from 'dayjs'
import { useGetApiBabyId, useGetApiEventLog } from '~/schemas/services/myAPI'
import { getUploadThumbnailURL } from '~/utils/getUploadURL'

const { data, suspense } = useGetApiEventLog()

const diaperCount = data.value?.filter(item => item.eventName === 'Diaper').length
const feedCount = data.value?.filter(item => item.eventName === 'Feed').length
const outCount = data.value?.filter(item => item.eventName === 'Outing').length
const supplyCount = data.value?.filter(item => item.eventName === 'Supplement').length
const sleepCount = data.value?.filter(item => item.eventName === 'Sleep').length

const { data: baby, suspense: suspenseBaby } = useGetApiBabyId('1')

onServerPrefetch(async () => {
  return Promise.all([suspense(), suspenseBaby()])
})

const old = computed(() => {
  const bornAt = baby.value?.bornAt
  const nowDate = dayjs()
  const diffDay = nowDate.diff(bornAt, 'day')
  const diffMonth = nowDate.diff(bornAt, 'month')
  // 如果 100 天以内显示天数
  if (diffDay <= 100)
    return `${diffDay} days old`
  // 如果 365 天以内显示月数加天数
  if (diffDay <= 365) {
    // 月是整月
    // day 要减去 month 的天数
    const addMonth = dayjs(bornAt).add(diffMonth, 'month')
    const diffDay2 = nowDate.diff(addMonth, 'day')
    return `${diffMonth} months ${diffDay2} days old`
  }
  // 如果 365 天以外显示年数加月数
  // month 要减去 year 的月数
  const diffYear = nowDate.diff(bornAt, 'year')
  return `${diffYear} years ${diffMonth} months old`
})
const avatar = computed(() => {
  return getUploadThumbnailURL(baby.value?.avatar)
})

const router = useRouter()

const { logout, user } = useAuth()
</script>

<template>
  <div class="container">
    <div class="setting-hero pt-50px pb-16">
      <div class="flex items-center gap-4 px-10%">
        <van-image round :src="avatar" width="64" height="64" fit="cover" class="hero-avatar">
          <template #loading>
            <van-loading type="spinner" size="20" />
          </template>
        </van-image>
        <div class="flex flex-col justify-around gap-1">
          <div class="text-lg text-white font-semibold tracking-tight">
            {{ baby?.name }}
          </div>
          <div class="text-sm text-white/80 leading-relaxed">
            Born on {{ baby?.bornAt }} <br>
            <span class="text-white font-medium">
              {{ old }}
              <van-icon
                name="info-o" @click="showToast({
                  message: 'First day is 0 days old.',
                })"
              />
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- floating stats card overlapping the hero -->
    <div class="px-4">
      <div class="stats-card glass-strong -mt-10 flex justify-evenly rounded-2xl py-4 text-center">
        <div class="stat-col" @click="router.push('/setting/growth-chart')">
          <div class="stat-num">{{ diaperCount }}</div>
          <div class="stat-cap">尿不湿</div>
        </div>
        <div class="stat-col">
          <div class="stat-num">{{ feedCount }}</div>
          <div class="stat-cap">喂养</div>
        </div>
        <div class="stat-col">
          <div class="stat-num">{{ outCount }}</div>
          <div class="stat-cap">外出</div>
        </div>
        <div class="stat-col">
          <div class="stat-num">{{ supplyCount }}</div>
          <div class="stat-cap">补剂</div>
        </div>
        <div class="stat-col">
          <div class="stat-num">{{ sleepCount }}</div>
          <div class="stat-cap">睡眠</div>
        </div>
      </div>
    </div>

    <van-cell-group inset class="!mt-4">
      <van-cell title="宝宝信息" is-link size="large" to="/setting/profile" />
      <van-cell title="喂养记录" is-link size="large" to="/setting/feed-logs" />
      <van-cell v-if="false" title="疫苗记录" is-link size="large" @click="showToast('Not Implemented')" />
      <van-cell v-if="false" title="家庭成员" is-link size="large" @click="showToast('Not Implemented')" />
      <van-cell title="意见反馈" is-link size="large" to="/setting/feedback" />
      <van-cell title="用户协议" is-link size="large" @click="showToast('Not Implemented')" />
    </van-cell-group>
    <div class="mt-8 px-4 pb-8">
      <van-button round block color="#ec489a" @click="logout">
        退出登录
      </van-button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.container {
  background: var(--app-bg);
  height: 100%;
  overflow: auto;
}

.setting-hero {
  background: linear-gradient(150deg, #ff7ab6 0%, #ec489a 55%, #d63384 100%);
}

.hero-avatar {
  border: 2px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 6px 18px -4px rgba(0, 0, 0, 0.25);
}

.stats-card {
  box-shadow: 0 8px 28px -10px rgba(20, 20, 36, 0.22);
}

.stat-col {
  transition: transform var(--dur-press) var(--ease-out);
  cursor: pointer;
  &:active {
    transform: scale(0.96);
  }
}
.stat-num {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--app-ink);
}
.stat-cap {
  margin-top: 2px;
  font-size: 11px;
  color: var(--app-ink-3);
}
</style>
