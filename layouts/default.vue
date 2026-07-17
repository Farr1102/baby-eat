<script lang="ts" setup>
import { ref } from 'vue'

const activeTab = ref('/')

const router = useRouter()
const route = useRoute()

if (route.path.length > 1) {
  const path = route.path.split('/')[1]
  activeTab.value = `/${path}`
}

router.beforeEach((to, from, next) => {
  const toPath = to.path
  if (toPath.length > 1) {
    const path = toPath.split('/')[1]
    activeTab.value = `/${path}`
  }
  next()
})
</script>

<template>
  <div id="root-container" class="container">
    <slot />
    <van-tabbar
      v-model="activeTab" class="tabbar-glass !absolute" active-color="#ec489a"
      :safe-area-inset-bottom="false" :border="false"
    >
      <van-tabbar-item name="/" icon="home-o" @click="router.push('/')">
        首页
      </van-tabbar-item>
      <van-tabbar-item name="/moments" icon="apps-o" @click="router.push('/moments')">
        时刻
      </van-tabbar-item>
      <van-tabbar-item name="/setting" icon="setting-o" @click="router.push('/setting')">
        设置
      </van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<style scoped>
.container {
  position: relative;
  height: 100%;
  max-width: 500px;
  margin: auto;
}

:deep(.van-tabbar-item__icon) {
  transition: transform 0.3s var(--ease-spring);
}
:deep(.van-tabbar-item--active .van-tabbar-item__icon) {
  transform: scale(1.12);
}
</style>
