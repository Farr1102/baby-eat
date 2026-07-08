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
html, body , #__nuxt {
  height: 100%;
  margin: 0;
  color: #333;
}

body {
  margin-top: env(safe-area-inset-top);
  height: calc(100% - env(safe-area-inset-bottom));
  color: #333;
}

html.dark {
  background: #222;
  color: white;
}

.van-field__label {
  flex: none !important;
}
</style>
