import axios from 'axios'
import type { MatchConfig, MatchPage, MatchRecord } from '../game/records'

export const api = axios.create({ baseURL: '/api', timeout: 3000 })

export async function fetchRanking(config: MatchConfig, page: number, signal?: AbortSignal): Promise<MatchPage> {
  const { data } = await api.get<MatchPage>('/ranking', {
    params: { matchSeconds: config.matchSeconds, spawnIntervalSeconds: config.spawnIntervalSeconds, page },
    signal,
  })
  return data
}

export async function fetchHistory(playerId: string, page: number, signal?: AbortSignal): Promise<MatchPage> {
  const { data } = await api.get<MatchPage>('/history', { params: { playerId, page }, signal })
  return data
}

export async function submitMatch(record: MatchRecord): Promise<MatchRecord> {
  const { data } = await api.post<MatchRecord>('/matches', record)
  return data
}

export async function resetRecords(): Promise<void> {
  await api.post('/reset')
}
