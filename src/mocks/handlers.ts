import { delay, http, HttpResponse } from 'msw'
import type { OptionsStorage } from '../game/options'
import { listPlayerMatches, paginate, rankMatches, isMatchRecord } from '../game/records'
import { readScenario } from './scenarios'
import { confirmMatch, readAllMatches, writeConfirmed } from './store'

const SLOW_MS = 1500
const TIMEOUT_MS = 10000

export function createHandlers(storage: OptionsStorage) {
  return [
    http.get('*/api/ranking', async ({ request }) => {
      const blocked = await blockedResponse(storage)
      if (blocked) return blocked
      if (readScenario(storage) === 'empty') return HttpResponse.json(paginate([], 1))
      const url = new URL(request.url)
      return HttpResponse.json(
        rankMatches(
          readAllMatches(storage),
          {
            matchSeconds: Number(url.searchParams.get('matchSeconds')),
            spawnIntervalSeconds: Number(url.searchParams.get('spawnIntervalSeconds')),
          },
          Number(url.searchParams.get('page') ?? '1'),
        ),
      )
    }),
    http.get('*/api/history', async ({ request }) => {
      const blocked = await blockedResponse(storage)
      if (blocked) return blocked
      if (readScenario(storage) === 'empty') return HttpResponse.json(paginate([], 1))
      const url = new URL(request.url)
      return HttpResponse.json(
        listPlayerMatches(
          readAllMatches(storage),
          url.searchParams.get('playerId') ?? '',
          Number(url.searchParams.get('page') ?? '1'),
        ),
      )
    }),
    http.post('*/api/matches', async ({ request }) => {
      const blocked = await blockedResponse(storage)
      if (blocked) return blocked
      const body: unknown = await request.json()
      if (!isMatchRecord(body)) return HttpResponse.json({ message: 'invalid' }, { status: 400 })
      return HttpResponse.json(confirmMatch(storage, body))
    }),
    http.post('*/api/reset', () => {
      writeConfirmed(storage, [])
      return new HttpResponse(null, { status: 204 })
    }),
  ]
}

async function blockedResponse(storage: OptionsStorage): Promise<Response | null> {
  const scenario = readScenario(storage)
  if (scenario === 'error') return HttpResponse.json({ message: 'unavailable' }, { status: 500 })
  if (scenario === 'timeout') await delay(TIMEOUT_MS)
  if (scenario === 'slow') await delay(SLOW_MS)
  return null
}
