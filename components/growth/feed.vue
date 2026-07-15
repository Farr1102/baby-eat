<script setup lang="ts">
import { Chart } from '@antv/g2'
import dayjs from 'dayjs'
import { groupBy } from 'lodash-es'
import { useFontLoad } from '~/composables/font'
import { useGetApiEventLog } from '~/schemas/services/myAPI'

const { data, suspense } = useGetApiEventLog()
onServerPrefetch(suspense)

const diaperData = computed(() => {
  const _ = data.value?.filter(x => x.eventName === 'Feed') || []
  const grouped = groupBy(_, (x) => {
    return dayjs(x.eventTime).format('YYYY-MM-DD')
  })
  return Object.keys(grouped).map((x) => {
    return {
      date: x,
      count: grouped[x].length,
    }
  }).reverse()
})

const chartContainer = ref()

const store = useFontLoad()

const colorMode = useColorMode()

function renderChart() {
  const isDark = colorMode.value === 'dark'
  const tickStroke = isDark ? '#48484a' : '#cdcdcd'
  const chart = new Chart({
    container: chartContainer.value,
    autoFit: true,
    theme: isDark ? 'classicDark' : 'classic',
  })
  chart
    .line()
    .data(diaperData.value)
    .encode('x', (d) => {
      return dayjs(d.date).format('MM-DD')
    })
    .encode('y', 'count')
    .axis('x', {
      tickStroke,
      label: false,
    })
    .axis('y', {
      tickStroke,
      titleFontFamily: 'Gaegu',
      labelFontFamily: 'Gaegu',
      title: 'Feed Count',
    })
    .style('shape', 'smooth')
    .tooltip(false)
  chart.render()
  return chart
}

onMounted(() => {
  watchEffect((onCleanup) => {
    // read colorMode so switching theme rebuilds the chart
    void colorMode.value
    if (store.loaded && data.value) {
      const c = renderChart()
      onCleanup(() => {
        c.destroy()
      })
    }
  })
})
</script>

<template>
  <div ref="chartContainer" class="pointer-events-none h-full w-full" />
</template>

<style lang="scss" scoped>

</style>
