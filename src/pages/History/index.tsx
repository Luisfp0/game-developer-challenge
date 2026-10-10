import { useState } from 'react'
import { MatchHistory } from '../../components/MatchHistory'
import { readMatchHistory } from '../../game/lastMatch'

type HistoryPageProps = {
  onBack: () => void
}

export function HistoryPage({ onBack }: HistoryPageProps) {
  const [matches] = useState(() => readMatchHistory(localStorage))
  return <MatchHistory matches={matches} onBack={onBack} />
}
