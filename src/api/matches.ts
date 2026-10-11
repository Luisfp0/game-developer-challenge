import axios from 'axios'
import type { MatchConfig, MatchPage, MatchRecord } from '../game/records'

const api = axios.create({ baseURL: '/api', timeout: 3000 })

export const fetchRanking = async (config: MatchConfig, page: number, signal?: AbortSignal): Promise<MatchPage> => {
  const { data } = await api.get<MatchPage>('/ranking', {
    params: { matchSeconds: config.matchSeconds, spawnIntervalSeconds: config.spawnIntervalSeconds, page },
    signal,
  })
  return data
}

export const fetchHistory = async (playerId: string, page: number, signal?: AbortSignal): Promise<MatchPage> => {
  const { data } = await api.get<MatchPage>('/history', { params: { playerId, page }, signal })
  return data
}

export const submitMatch = async (record: MatchRecord): Promise<MatchRecord> => {
  const { data } = await api.post<MatchRecord>('/matches', record)
  return data
}

export const resetRecords = async (): Promise<void> => {
  await api.post('/reset')
}
