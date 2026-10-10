import type { OptionsStorage } from '../options'
import { isMatchRecord, type MatchRecord } from '../records'

export const PENDING_MATCHES_KEY = 'pirate-battle-pending-matches'

export function readPending(storage: OptionsStorage): MatchRecord[] {
  const raw = storage.getItem(PENDING_MATCHES_KEY)
  if (raw === null) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isMatchRecord)
  } catch {
    return []
  }
}

export function savePending(storage: OptionsStorage, records: MatchRecord[]): boolean {
  try {
    storage.setItem(PENDING_MATCHES_KEY, JSON.stringify(records))
    return true
  } catch {
    return false
  }
}

export function enqueuePending(storage: OptionsStorage, record: MatchRecord): boolean {
  const pending = readPending(storage).filter((item) => item.matchId !== record.matchId)
  return savePending(storage, [record, ...pending])
}

export function dropPending(storage: OptionsStorage, matchId: string): boolean {
  return savePending(
    storage,
    readPending(storage).filter((item) => item.matchId !== matchId),
  )
}
