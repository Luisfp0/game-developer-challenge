import { GameCanvas } from '../../components/GameCanvas'
import { Hud } from '../../components/Hud'
import type { MatchSnapshot } from '../../types/game'

type MatchPageProps = {
  score: number
  remainingSeconds: number
  onSnapshot: (snapshot: MatchSnapshot) => void
  onLoadError: (message: string) => void
}

export function MatchPage({ score, remainingSeconds, onSnapshot, onLoadError }: MatchPageProps) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <GameCanvas onSnapshot={onSnapshot} onLoadError={onLoadError} />
      <Hud score={score} remainingSeconds={remainingSeconds} />
    </div>
  )
}
