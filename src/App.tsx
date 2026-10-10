import { useState } from 'react'
import { MatchResult } from './components/MatchResult'
import { readOptions } from './game/options'
import { MenuPage } from './pages/Menu'
import { MatchPage } from './pages/Match'
import { OptionsPage } from './pages/Options'
import type { MatchSnapshot, Phase } from './types/game'

export function App() {
  const [phase, setPhase] = useState<Phase>('menu')
  const [error, setError] = useState<string | null>(null)
  const [matchKey, setMatchKey] = useState(0)
  const [score, setScore] = useState(0)
  const [remainingSeconds, setRemainingSeconds] = useState(60)
  const [matchSeconds, setMatchSeconds] = useState(60)
  const [spawnIntervalSeconds, setSpawnIntervalSeconds] = useState(10)
  const [result, setResult] = useState<MatchSnapshot | null>(null)

  function leaveMatch() {
    setScore(0)
    setResult(null)
    setPhase('menu')
  }

  function play() {
    const saved = readOptions(localStorage)
    setError(null)
    setResult(null)
    setScore(0)
    setRemainingSeconds(saved.matchSeconds)
    setMatchSeconds(saved.matchSeconds)
    setSpawnIntervalSeconds(saved.spawnIntervalSeconds)
    setMatchKey((key) => key + 1)
    setPhase('playing')
  }

  if (phase === 'menu') {
    return <MenuPage error={error} onPlay={play} onOptions={() => setPhase('options')} />
  }

  if (phase === 'options') {
    return <OptionsPage onBack={() => setPhase('menu')} />
  }

  if (phase === 'result' && result?.endReason) {
    return (
      <MatchResult
        score={result.score}
        timePlayedSeconds={result.timePlayedSeconds}
        endReason={result.endReason}
        onPlayAgain={play}
        onMainMenu={() => setPhase('menu')}
      />
    )
  }

  return (
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
        if (snapshot.phase === 'result') {
          setResult(snapshot)
          setPhase('result')
        }
      }}
    />
  )
}
