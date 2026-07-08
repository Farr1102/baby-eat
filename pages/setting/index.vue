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
    <div class="h-[200px] bg-pink pt-50px">
      <div class="flex items-center gap-4 px-10%">
        <van-image round :src="avatar" width="60" height="60" fit="cover">
          <template #loading>
            <van-loading type="spinner" size="20" />
          </template>
        </van-image>
        <div class="flex flex-col justify-around">
          <div class="text-base text-white">
            {{ baby.name }}
          </div>
          <div class="text-sm text-#ddd">
            Born on {{ baby.bornAt }} <br>
            <span class="text-white">
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
      <div class="mt-6 flex justify-evenly text-center text-sm text-light">
        <div @click="router.push('/setting/growth-chart')">
          <div>
            {{ diaperCount }}
          </div>
          <div>
            尿不湿
          </div>
        </div>
        <div>
          <div>
            {{ feedCount }}
          </div>
          <div>
            喂养
          </div>
        </div>
        <div>
          <div>
            {{ outCount }}
          </div>
          <div>
            外出
          </div>
        </div>
        <div>
          <div>
            {{ supplyCount }}
          </div>
          <div>
            补剂
          </div>
        </div>
        <div>
          <div>
            {{ sleepCount }}
          </div>
          <div>
            睡眠
          </div>
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
  font-family: -apple-system, BlinkMacSystemFont, "Segoe WPC", "Segoe UI", "HelveticaNeue-Light", system-ui, "Ubuntu", "Droid Sans", sans-serif;
  background-color: #f5f5f5;
  height: 100%;
}
</style>
