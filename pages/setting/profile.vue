<script setup lang="ts">
import { useGetApiBabyId, usePatchApiBaby } from '~/schemas/services/myAPI'

const { data, suspense } = useGetApiBabyId('1')

const model = reactive<{ name: string; bornAt: string; gender: number }>({
  name: '',
  bornAt: '',
  gender: 0,
})

watchEffect(() => {
  if (data.value) {
    Object.assign(model, toRaw(data.value))
  }
})

const showPicker = ref(false)
const router = useRouter()
const { isPending, mutate } = usePatchApiBaby({
  mutation: {
    onSuccess() {
      router.replace('/setting')
    },
  },
})

function onSubmit() {
  mutate({ data: { ...model, id: 1 } })
}

const avatarEmoji = computed(() => model.gender === 1 ? '👦' : '👧')
// semi-transparent tint adapts to light/dark instead of a fixed pale block
const avatarBg = computed(() => model.gender === 1 ? 'rgba(59, 130, 246, 0.18)' : 'rgba(236, 72, 154, 0.18)')
</script>

<template>
  <div class="h-full" style="background: var(--app-bg)">
    <van-nav-bar title="宝宝信息" left-arrow class="glass-strong !sticky top-0 z-20 mb-4" @click-left="router.back" />
    <van-form @submit="onSubmit">
      <van-cell-group inset>
        <!-- Avatar preview -->
        <van-field name="avatar" label="头像">
          <template #input>
            <div
              class="mt-1 flex h-12 w-12 items-center justify-center rounded-full text-2xl"
              :style="{ backgroundColor: avatarBg }"
            >
              {{ avatarEmoji }}
            </div>
          </template>
        </van-field>

        <van-field
          v-model="model.name"
          name="name"
          label="姓名"
          placeholder="姓名"
          required
          :rules="[{ required: true, message: '请填写姓名' }]"
        />
        <van-field
          v-model="model.bornAt"
          is-link
          readonly
          name="bornAt"
          label="出生日期"
          placeholder="点击选择日期"
          @click="showPicker = true"
        />
        <van-field name="gender" label="性别">
          <template #input>
            <van-radio-group v-model="model.gender" direction="horizontal">
              <van-radio :name="1">男宝</van-radio>
              <van-radio :name="0">女宝</van-radio>
            </van-radio-group>
          </template>
        </van-field>
        <client-only>
          <van-popup v-model:show="showPicker" teleport="#root-container" class="!absolute" position="bottom">
            <van-date-picker
              :model-value="model.bornAt.split('-')"
              @confirm="({ selectedValues }) => { model.bornAt = selectedValues.join('-'); showPicker = false }"
              @cancel="showPicker = false"
            />
          </van-popup>
        </client-only>
      </van-cell-group>
      <div style="margin: 16px;">
        <van-button :loading="isPending" round block color="#ec489a" native-type="submit">
          保存
        </van-button>
      </div>
    </van-form>
  </div>
</template>
