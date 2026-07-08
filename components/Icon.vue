<script setup lang="ts">
import { isRemoteImage } from '~/utils/isRemoteImage'

const props = defineProps(['name', 'class', 'previewDisabled'])

const isImg = computed(() => isRemoteImage(props.name))

const isEmoji = computed(() => {
  if (!props.name || typeof props.name !== 'string') return false
  // Simple emoji detection: matches most common emoji characters
  return /^(\p{Emoji_Presentation}|\p{Emoji}️)$/u.test(props.name)
})
</script>

<template>
  <n-image
    v-if="isImg"
    object-fit="contain"
    :img-props="{
      class: 'w-full h-full',
    }"
    :preview-disabled="previewDisabled"
    class="icon"
    :class="[props.class]"
    :alt="name"
    :src="name"
  />
  <span v-else-if="isEmoji" class="emoji-icon" :class="[props.class]">{{ name }}</span>
  <svg v-else class="icon" :class="[props.class]" aria-hidden="true" preserveAspectRatio="none">
    <use :href="`#${name}`" />
  </svg>
</template>

<style scoped>
.icon {
  width: 1em;
  height: 1em;
  vertical-align: -0.15em;
  fill: currentColor;
  overflow: hidden;
}

.emoji-icon {
  font-size: inherit;
  line-height: 1;
}
</style>
