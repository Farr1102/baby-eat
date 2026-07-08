import type { EventLogResult } from '~/schemas/model'

export function getDesc(value: unknown, unit: string) {
  return value ? ` ${value}${unit}` : ''
}

export function formatLogInfo(eventLogResult: EventLogResult) {
  const { extra, eventName, event } = eventLogResult

  if (eventName === 'Weigh') {
    const w = extra?.weight ? `体重${getDesc(extra.weight, 'kg')}` : ''
    return w || event.displayName
  }

  if (eventName === 'Feed') {
    const type = extra?.type || ''
    const vol = getDesc(extra?.milkVolume, 'ml')
    const desc = `${type}${vol}`.trim()
    return desc || event.displayName
  }

  if (eventName === 'Diaper') {
    return extra?.source ? `${extra.source}` : event.displayName
  }

  if (eventName === 'Supplement') {
    return extra?.type ? `${extra.type}` : event.displayName
  }

  return event.displayName
}
