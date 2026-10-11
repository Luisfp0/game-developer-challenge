import type { OptionsStorage } from '../options'
import { PLAYER_STORAGE_KEY } from './constants'
import type { Player } from './types'

export { PLAYER_STORAGE_KEY }
export type { Player }

const isPlayer = (value: unknown): value is Player => {
  if (!value || typeof value !== 'object') return false
  const player = value as Record<string, unknown>
  return typeof player.id === 'string' && player.id.length > 0 && player.name === 'You'
}

export const readPlayer = (storage: OptionsStorage, createId: () => string): Player => {
  try {
    const raw = storage.getItem(PLAYER_STORAGE_KEY)
    if (raw !== null) {
      const parsed: unknown = JSON.parse(raw)
      if (isPlayer(parsed)) return parsed
    }
    const player = { id: createId(), name: 'You' as const }
    storage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(player))
    return player
  } catch {
    return { id: createId(), name: 'You' }
  }
}
