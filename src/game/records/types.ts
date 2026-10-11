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
