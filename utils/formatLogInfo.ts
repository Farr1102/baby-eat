import type { EventLogResult } from '~/schemas/model'

export function getDesc(value: unknown, unit: string) {
  return value ? ` ${value}${unit}` : ''
}

const FEED_MAP: Record<string, string> = { Breast: '母乳', Formula: '配方奶' }
const DIAPER_MAP: Record<string, string> = { Wet: '尿', Dirty: '便', Both: '尿便' }

export function formatLogInfo(eventLogResult: EventLogResult) {
  const { extra, eventName, event } = eventLogResult

  if (eventName === 'Weigh') {
    const w = extra?.weight ? `体重${getDesc(extra.weight, 'kg')}` : ''
    return w || event.displayName
  }

  if (eventName === 'Feed') {
    let typeStr = ''
    const t = extra?.type
    if (Array.isArray(t)) {
      typeStr = t.join('/')
    } else if (t) {
      typeStr = String(t)
    }
    const vol = getDesc(extra?.milkVolume, 'ml')
    const desc = `${typeStr}${vol}`.trim()
    return desc || event.displayName
  }

  if (eventName === 'Diaper') {
    const src = DIAPER_MAP[extra?.source as string] || extra?.source
    return src ? `${src}` : event.displayName
  }

  if (eventName === 'Supplement') {
    return extra?.taken === '是' ? 'AD: 已吃' : 'AD'
  }

  return event.displayName
}
