import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { fetchHistory, fetchRanking, submitMatch } from '../../api/matches'
import { GoldButton, Screen } from '../../components/ui'
import { dropPending, readPending, savePending } from '../../game/pending'
import { readOptions } from '../../game/options'
import { readPlayer } from '../../game/player'
import { PAGE_SIZE, type MatchRecord } from '../../game/records'

type LogTab = 'ranking' | 'history'

type LogPageProps = {
  tab: LogTab
  onTab: (tab: LogTab) => void
  onBack: () => void
}

const playedAtLabel = (playedAt: string): string => {
  const date = new Date(playedAt)
  if (Number.isNaN(date.getTime())) return playedAt
  const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase()
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${day} ${month} · ${hours}:${minutes}`
}

const durationLabel = (seconds: number): string => {
  const total = Math.max(0, Math.round(seconds))
  const minutes = Math.floor(total / 60)
  const rest = total % 60
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`
}

const reasonLabel = (endReason: MatchRecord['endReason']): string => {
  return endReason === 'time' ? 'Time is up' : 'Destroyed'
}

const pageCountOf = (total: number, pageSize: number): number => {
  return Math.max(1, Math.ceil(total / (pageSize || PAGE_SIZE)))
}

export const LogPage = ({ tab, onTab, onBack }: LogPageProps) => {
  const [player] = useState(() => readPlayer(localStorage, () => crypto.randomUUID()))
  const [config] = useState(() => readOptions(localStorage))
  const [rankingPage, setRankingPage] = useState(1)
  const [historyPage, setHistoryPage] = useState(1)
  const [pending, setPending] = useState(() => readPending(localStorage))
  const [retryingId, setRetryingId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const ranking = useQuery({
    queryKey: ['ranking', config.matchSeconds, config.spawnIntervalSeconds, rankingPage],
    queryFn: ({ signal }) => fetchRanking(config, rankingPage, signal),
    placeholderData: keepPreviousData,
    enabled: tab === 'ranking',
  })
  const history = useQuery({
    queryKey: ['history', player.id, historyPage],
    queryFn: ({ signal }) => fetchHistory(player.id, historyPage, signal),
    placeholderData: keepPreviousData,
    enabled: tab === 'history',
  })
  const retry = useMutation({
    mutationFn: submitMatch,
    onSuccess: (record) => {
      dropPending(localStorage, record.matchId)
      setPending(readPending(localStorage))
      setRetryingId(null)
      void queryClient.invalidateQueries({ queryKey: ['history'] })
      void queryClient.invalidateQueries({ queryKey: ['ranking'] })
    },
    onError: () => setRetryingId(null),
  })

  useEffect(() => {
    if (!history.data) return
    const confirmed = new Set(history.data.items.map((item) => item.matchId))
    setPending((current) => {
      const next = current.filter((item) => !confirmed.has(item.matchId))
      if (next.length === current.length) return current
      savePending(localStorage, next)
      return next
    })
  }, [history.data])

  const retryPending = (match: MatchRecord) => {
    setRetryingId(match.matchId)
    retry.mutate(match)
  }

  const active = tab === 'ranking' ? ranking : history
  const page = tab === 'ranking' ? rankingPage : historyPage
  const setPage = tab === 'ranking' ? setRankingPage : setHistoryPage
  const pageCount = active.data ? pageCountOf(active.data.total, active.data.pageSize) : 1
  const matches = active.data?.items ?? []

  return (
    <Screen wide>
      <h1>Captain's Log</h1>
      <div className="tabs" role="tablist">
        <GoldButton type="button" compact variant={tab === 'ranking' ? 'primary' : 'secondary'} role="tab" aria-selected={tab === 'ranking'} onClick={() => onTab('ranking')}>
          Ranking
        </GoldButton>
        <GoldButton type="button" compact variant={tab === 'history' ? 'primary' : 'secondary'} role="tab" aria-selected={tab === 'history'} onClick={() => onTab('history')}>
          Match History
        </GoldButton>
      </div>
      <p className="note">
        {tab === 'ranking'
          ? `${config.matchSeconds} second battles · ${config.spawnIntervalSeconds} second spawn interval`
          : 'Your recent battles'}
      </p>
      {active.isPending ? <p>Loading.</p> : null}
      {active.isFetching && !active.isPending ? <p>Updating.</p> : null}
      {active.isError ? (
        <>
          <p role="alert">{tab === 'ranking' ? 'Could not load the ranking.' : 'Could not load the match history.'}</p>
          <GoldButton
            type="button"
            compact
            onClick={() => {
              void queryClient.invalidateQueries({ queryKey: [tab === 'ranking' ? 'ranking' : 'history'] })
            }}
          >
            Try again
          </GoldButton>
        </>
      ) : null}
      {!active.isPending && !active.isError && matches.length === 0 && (tab === 'ranking' || pending.length === 0) ? (
        <p>{tab === 'ranking' ? 'No ranked matches for this configuration.' : 'No matches yet.'}</p>
      ) : null}
      {tab === 'history' && pending.length > 0 ? (
        <div className="table-wrap">
          <table className="record-table">
            <caption>Pending</caption>
            <thead>
              <tr>
                <th>Date</th>
                <th>Points</th>
                <th>Duration</th>
                <th>Result</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pending.map((match) => (
                <tr key={match.matchId}>
                  <td>{playedAtLabel(match.playedAt)}</td>
                  <td>{match.score}</td>
                  <td>{durationLabel(match.timePlayedSeconds)}</td>
                  <td>Pending.</td>
                  <td>
                    <GoldButton type="button" compact disabled={retryingId === match.matchId} onClick={() => retryPending(match)}>
                      Try again
                    </GoldButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {matches.length > 0 ? (
        <div className="table-wrap">
          <table className="record-table">
            <thead>
              <tr>
                {tab === 'ranking' ? (
                  <>
                    <th>Rank</th>
                    <th>Captain</th>
                    <th>Points</th>
                    <th>Played</th>
                  </>
                ) : (
                  <>
                    <th>Date</th>
                    <th>Points</th>
                    <th>Duration</th>
                    <th>Result</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {matches.map((match, index) => (
                <tr key={match.matchId} className={match.playerName === 'You' ? 'is-you' : undefined}>
                  {tab === 'ranking' ? (
                    <>
                      <td>{String((page - 1) * PAGE_SIZE + index + 1).padStart(2, '0')}</td>
                      <td>{match.playerName}</td>
                      <td>{match.score}</td>
                      <td>{playedAtLabel(match.playedAt)}</td>
                    </>
                  ) : (
                    <>
                      <td>{playedAtLabel(match.playedAt)}</td>
                      <td>{match.score}</td>
                      <td>{durationLabel(match.timePlayedSeconds)}</td>
                      <td className={match.endReason === 'destroyed' ? 'result-destroyed' : undefined}>{reasonLabel(match.endReason)}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {!active.isPending && pageCount > 1 ? (
        <div className="pager">
          <button type="button" className="round-button" aria-label="Previous" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
            ‹
          </button>
          <p>
            Page {active.data?.page ?? page} of {pageCount}
          </p>
          <button type="button" className="round-button" aria-label="Next" disabled={page >= pageCount} onClick={() => setPage((current) => current + 1)}>
            ›
          </button>
        </div>
      ) : null}
      <div className="button-stack" style={{ marginTop: 16 }}>
        <GoldButton type="button" onClick={onBack}>
          Main menu
        </GoldButton>
      </div>
    </Screen>
  )
}
