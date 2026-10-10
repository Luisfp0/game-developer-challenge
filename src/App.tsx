import { useState } from 'react'
import { MatchResult } from './components/MatchResult'
import { MenuPage } from './pages/Menu'
import { MatchPage } from './pages/Match'
import type { MatchSnapshot, Phase } from './types/game'

export function App() {
  const [phase, setPhase] = useState<Phase>('menu')
  const [error, setError] = useState<string | null>(null)
  const [matchKey, setMatchKey] = useState(0)
  const [score, setScore] = useState(0)
  const [remainingSeconds, setRemainingSeconds] = useState(60)
  const [result, setResult] = useState<MatchSnapshot | null>(null)

  function play() {
    setError(null)
    setResult(null)
    setScore(0)
    setRemainingSeconds(60)
    setMatchKey((key) => key + 1)
    setPhase('playing')
  }

  if (phase === 'menu') {
    return <MenuPage error={error} onPlay={play} />
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
