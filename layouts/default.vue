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

/* Translucent floating tab bar — content scrolls underneath */
.tabbar-glass {
  background: rgba(255, 255, 255, 0.72) !important;
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  box-shadow: 0 -0.5px 0 rgba(0, 0, 0, 0.08);
}

/* Scroll-edge fade where content meets the floating chrome */
.tabbar-glass::before {
  content: "";
  position: absolute;
  top: -16px;
  left: 0;
  right: 0;
  height: 16px;
  background: linear-gradient(to top, rgba(242, 242, 247, 0.6), transparent);
  pointer-events: none;
}

:deep(.van-tabbar-item__icon) {
  transition: transform 0.3s cubic-bezier(0.34, 1.4, 0.64, 1);
}
:deep(.van-tabbar-item--active .van-tabbar-item__icon) {
  transform: scale(1.12);
}

:global(html.dark) .tabbar-glass {
  background: rgba(28, 28, 30, 0.72) !important;
  box-shadow: 0 -0.5px 0 rgba(255, 255, 255, 0.1);
}
:global(html.dark) .tabbar-glass::before {
  background: linear-gradient(to top, rgba(0, 0, 0, 0.5), transparent);
}
</style>
