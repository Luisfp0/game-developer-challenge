import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { resetRecords, submitMatch } from './api/matches'
import { MatchResult } from './components/MatchResult'
import { SAVE_FAILED_TOAST, RESTORED_TOAST, SAVED_TOAST, Toast } from './components/ui'
import { dropPending, enqueuePending, PENDING_MATCHES_KEY } from './game/pending'
import { readPlayer } from './game/player'
import { readOptions } from './game/options'
import type { MatchRecord } from './game/records'
import { migrateSavedMatches } from './mocks/store'
import { readScenario, writeScenario, type NetworkScenario } from './mocks/scenarios'
import { LogPage } from './pages/Log'
import { MenuPage } from './pages/Menu'
import { MatchPage } from './pages/Match'
import { OptionsPage } from './pages/Options'
import type { MatchSnapshot, Phase, RegistrationStatus } from './types/game'

export const App = () => {
  const queryClient = useQueryClient()
  const [player] = useState(() => {
    const current = readPlayer(localStorage, () => crypto.randomUUID())
    try {
      migrateSavedMatches(localStorage, current, () => crypto.randomUUID())
    } catch {}
    return current
  })
  const [phase, setPhase] = useState<Phase>('menu')
  const [error, setError] = useState<string | null>(null)
  const [matchKey, setMatchKey] = useState(0)
  const [score, setScore] = useState(0)
  const [remainingSeconds, setRemainingSeconds] = useState(60)
  const [matchSeconds, setMatchSeconds] = useState(60)
  const [spawnIntervalSeconds, setSpawnIntervalSeconds] = useState(10)
  const [result, setResult] = useState<MatchSnapshot | null>(null)
  const [registration, setRegistration] = useState<RegistrationStatus>('pending')
  const [scenario, setScenario] = useState<NetworkScenario>(() => readScenario(localStorage))
  const [toast, setToast] = useState<string | null>(null)
  const reported = useRef(false)
  const activeRecord = useRef<MatchRecord | null>(null)
  const toastTimer = useRef(0)

  useEffect(() => () => window.clearTimeout(toastTimer.current), [])

  const showToast = (message: string) => {
    window.clearTimeout(toastTimer.current)
    setToast(message)
    toastTimer.current = window.setTimeout(() => setToast(null), 2500)
  }

  const submit = useMutation({
    mutationFn: submitMatch,
    onSuccess: (record) => {
      dropPending(localStorage, record.matchId)
      if (activeRecord.current?.matchId === record.matchId) setRegistration('saved')
      void queryClient.invalidateQueries({ queryKey: ['ranking'] })
      void queryClient.invalidateQueries({ queryKey: ['history'] })
    },
    onError: (_error, record) => {
      if (activeRecord.current?.matchId === record.matchId) setRegistration('failed')
    },
  })

  const publish = (snapshot: MatchSnapshot) => {
    const record: MatchRecord = {
      matchId: crypto.randomUUID(),
      playerId: player.id,
      playerName: player.name,
      playedAt: new Date().toISOString(),
      score: snapshot.score,
      timePlayedSeconds: snapshot.timePlayedSeconds,
      endReason: snapshot.endReason ?? 'time',
      matchSeconds,
      spawnIntervalSeconds,
    }
    activeRecord.current = record
    enqueuePending(localStorage, record)
    setRegistration('pending')
    submit.mutate(record)
  }

  const leaveMatch = () => {
    setScore(0)
    setResult(null)
    setPhase('menu')
  }

  const play = () => {
    const saved = readOptions(localStorage)
    reported.current = false
    activeRecord.current = null
    setError(null)
    setResult(null)
    setScore(0)
    setRemainingSeconds(saved.matchSeconds)
    setMatchSeconds(saved.matchSeconds)
    setSpawnIntervalSeconds(saved.spawnIntervalSeconds)
    setMatchKey((key) => key + 1)
    setPhase('playing')
  }

  const changeScenario = (next: NetworkScenario) => {
    writeScenario(localStorage, next)
    setScenario(next)
    void queryClient.invalidateQueries()
  }

  const resetSavedRecords = () => {
    void resetRecords()
      .then(() => {
        localStorage.removeItem(PENDING_MATCHES_KEY)
        showToast(RESTORED_TOAST)
        return queryClient.invalidateQueries()
      })
      .catch(() => showToast(SAVE_FAILED_TOAST))
  }

  let screen: ReactNode
  if (phase === 'menu') {
    screen = (
      <MenuPage
        error={error}
        scenario={scenario}
        onPlay={play}
        onOptions={() => setPhase('options')}
        onRanking={() => setPhase('ranking')}
        onHistory={() => setPhase('history')}
        onScenario={changeScenario}
        onResetRecords={resetSavedRecords}
      />
    )
  } else if (phase === 'options') {
    screen = (
      <OptionsPage
        onBack={() => setPhase('menu')}
        onSaved={() => {
          showToast(SAVED_TOAST)
          setPhase('menu')
        }}
        onSaveFailed={() => showToast(SAVE_FAILED_TOAST)}
      />
    )
  } else if (phase === 'ranking' || phase === 'history') {
    screen = <LogPage tab={phase} onTab={setPhase} onBack={() => setPhase('menu')} />
  } else if (phase === 'result' && result?.endReason) {
    screen = (
      <MatchResult
        score={result.score}
        timePlayedSeconds={result.timePlayedSeconds}
        endReason={result.endReason}
        registration={registration}
        onRetry={() => {
          const record = activeRecord.current
          if (!record) return
          setRegistration('pending')
          submit.mutate(record)
        }}
        onPlayAgain={play}
        onMainMenu={() => setPhase('menu')}
      />
    )
  } else {
    screen = (
      <MatchPage
        key={matchKey}
        score={score}
        remainingSeconds={remainingSeconds}
        matchSeconds={matchSeconds}
        spawnIntervalSeconds={spawnIntervalSeconds}
        onMainMenu={leaveMatch}
        onLoadError={(message) => {
          setError(message)
          setPhase('menu')
        }}
        onSnapshot={(snapshot) => {
          setScore(snapshot.score)
          setRemainingSeconds(Math.ceil(snapshot.remainingSeconds))
          if (snapshot.phase === 'result' && snapshot.endReason && !reported.current) {
            reported.current = true
            publish(snapshot)
            setResult(snapshot)
            setPhase('result')
          }
        }}
      />
    )
  }

  return (
    <>
      {screen}
      <Toast message={toast} />
    </>
  )
}
