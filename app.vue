<script setup lang="ts">
import { appName, iconfontUrl } from '~/constants'
import 'vant/es/toast/style/index.mjs'

useHead({
  title: appName,
})
</script>

<template>
  <VitePwaManifest />
  <NuxtLoadingIndicator />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
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
</style>
