<script setup lang="ts">
import { appName, iconfontUrl } from '~/constants'
import 'vant/es/toast/style/index.mjs'

const colorMode = useColorMode()
const vantTheme = computed(() => (colorMode.value === 'dark' ? 'dark' : 'light'))

useHead({
  title: appName,
  meta: [{
    id: 'theme-color',
    name: 'theme-color',
    content: () => (colorMode.value === 'dark' ? '#000000' : '#f2f2f7'),
  }],
})
</script>

<template>
  <VitePwaManifest />
  <NuxtLoadingIndicator color="#ec489a" />
  <van-config-provider :theme="vantTheme" class="h-full">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </van-config-provider>
  <ClientOnly>
    <Script type="application/javascript" :src="iconfontUrl" :async="true" />
  </ClientOnly>
</template>

<style>
:root {
  --app-bg: #f2f2f7;
  --app-surface: #ffffff;
  --app-ink: #1c1c1e;
  --app-ink-2: #3a3a3c;
  --app-ink-3: #8e8e93;
  --app-accent: #ec489a;
}

html, body , #__nuxt {
  height: 100%;
  margin: 0;
  color: var(--app-ink);
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", system-ui, "PingFang SC", "Microsoft YaHei", sans-serif;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  background: var(--app-bg);
}

body {
  margin-top: env(safe-area-inset-top);
  height: calc(100% - env(safe-area-inset-bottom));
}

html.dark {
  --app-bg: #000000;
  --app-surface: #1c1c1e;
  --app-ink: #ffffff;
  --app-ink-2: #ebebf0;
  --app-ink-3: #98989f;
  background: var(--app-bg);
  color: var(--app-ink);
}

.van-field__label {
  flex: none !important;
}

/* Vant dark theme → align with iOS elevated surfaces (#1c1c1e) instead of pure black */
html.dark {
  --van-background: #000000;
  --van-background-2: #1c1c1e;
  --van-background-3: #2c2c2e;
  --van-text-color: #ffffff;
  --van-text-color-2: #ebebf0;
  --van-text-color-3: #98989f;
  --van-cell-background: #1c1c1e;
  --van-cell-group-background: #1c1c1e;
  --van-field-input-text-color: #ffffff;
  --van-field-placeholder-text-color: #98989f;
  --van-nav-bar-icon-color: #ffffff;
  --van-nav-bar-title-text-color: #ffffff;
  --van-tabbar-item-text-color: #98989f;
  --van-tabbar-background: transparent;
  --van-border-color: #38383a;
  --van-action-sheet-background: #1c1c1e;
  --van-popover-light-background: #2c2c2e;
  --van-popover-light-text-color: #ffffff;
  --van-uploader-upload-background: #2c2c2e;
  --van-uploader-upload-active-color: #3a3a3c;
  --van-uploader-icon-color: #98989f;
}

/* Slightly rounder, softer Vant chrome to match iOS materials */
.van-nav-bar {
  --van-nav-bar-background: transparent;
}
.van-nav-bar__title {
  font-weight: 650;
  letter-spacing: -0.01em;
}
.van-button {
  transition: transform 0.15s ease-out, opacity 0.15s ease-out;
}
.van-button:active {
  transform: scale(0.97);
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

/* Translucent floating tab bar — content scrolls underneath */
.tabbar-glass {
  background: rgba(255, 255, 255, 0.72) !important;
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  box-shadow: 0 -0.5px 0 rgba(0, 0, 0, 0.08);
}
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
html.dark .tabbar-glass {
  background: rgba(22, 22, 24, 0.68) !important;
  box-shadow: inset 0 0.5px 0 rgba(255, 255, 255, 0.06);
}
html.dark .tabbar-glass::before {
  background: linear-gradient(to top, rgba(0, 0, 0, 0.55), transparent);
}

/* Frostier, near-solid surfaces when the user reduces transparency */
@media (prefers-reduced-transparency: reduce) {
  .glass, .glass-strong, .tabbar-glass, .form-popup,
  .dispatch-popover .van-popover__content {
    background: var(--app-surface) !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
  }
}
</style>
