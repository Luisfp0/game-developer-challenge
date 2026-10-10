import { GAME_CONFIG } from '../../constants/gameConfig'

export const PAGE_SIZE = 10

export type MatchEndReason = 'time' | 'destroyed'

export type MatchRecord = {
  matchId: string
  playerId: string
  playerName: string
  playedAt: string
  score: number
  timePlayedSeconds: number
  endReason: MatchEndReason
  matchSeconds: number
  spawnIntervalSeconds: number
}

export type MatchConfig = {
  matchSeconds: number
  spawnIntervalSeconds: number
}

export type MatchPage = {
  items: MatchRecord[]
  page: number
  pageSize: number
  total: number
}

export function paginate(items: MatchRecord[], page: number, pageSize = PAGE_SIZE): MatchPage {
  const safePage = Number.isInteger(page) && page > 0 ? page : 1
  const start = (safePage - 1) * pageSize
  return {
    items: items.slice(start, start + pageSize),
    page: safePage,
    pageSize,
    total: items.length,
  }
}

function byRank(left: MatchRecord, right: MatchRecord): number {
  if (right.score !== left.score) return right.score - left.score
  if (right.timePlayedSeconds !== left.timePlayedSeconds) return right.timePlayedSeconds - left.timePlayedSeconds
  if (left.playedAt !== right.playedAt) return left.playedAt < right.playedAt ? -1 : 1
  return left.matchId < right.matchId ? -1 : left.matchId > right.matchId ? 1 : 0
}

function byRecent(left: MatchRecord, right: MatchRecord): number {
  if (left.playedAt !== right.playedAt) return left.playedAt > right.playedAt ? -1 : 1
  return left.matchId < right.matchId ? -1 : left.matchId > right.matchId ? 1 : 0
}

export function rankMatches(records: MatchRecord[], config: MatchConfig, page: number): MatchPage {
  const same = records.filter(
    (record) =>
      record.matchSeconds === config.matchSeconds &&
      record.spawnIntervalSeconds === config.spawnIntervalSeconds,
  )
  return paginate([...same].sort(byRank), page)
}

export function listPlayerMatches(records: MatchRecord[], playerId: string, page: number): MatchPage {
  const own = records.filter((record) => record.playerId === playerId)
  return paginate([...own].sort(byRecent), page)
}

function wholeInRange(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max
}

export function isMatchRecord(value: unknown): value is MatchRecord {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return (
    typeof record.matchId === 'string' &&
    record.matchId.length > 0 &&
    typeof record.playerId === 'string' &&
    record.playerId.length > 0 &&
    typeof record.playerName === 'string' &&
    record.playerName.length > 0 &&
    typeof record.playedAt === 'string' &&
    record.playedAt.length > 0 &&
    typeof record.score === 'number' &&
    Number.isInteger(record.score) &&
    record.score >= 0 &&
    typeof record.timePlayedSeconds === 'number' &&
    Number.isFinite(record.timePlayedSeconds) &&
    record.timePlayedSeconds >= 0 &&
    (record.endReason === 'time' || record.endReason === 'destroyed') &&
    wholeInRange(record.matchSeconds, GAME_CONFIG.matchSecondsMin, GAME_CONFIG.matchSecondsMax) &&
    wholeInRange(record.spawnIntervalSeconds, GAME_CONFIG.spawnIntervalMin, GAME_CONFIG.spawnIntervalMax)
  )
}

export function registerMatch(
  records: MatchRecord[],
  incoming: MatchRecord,
): { records: MatchRecord[]; record: MatchRecord; created: boolean } {
  const existing = records.find((record) => record.matchId === incoming.matchId)
  if (existing) return { records, record: existing, created: false }
  return { records: [incoming, ...records], record: incoming, created: true }
}
