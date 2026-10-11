import type { HudProps } from './types'

export const Hud = ({ score, remainingSeconds }: HudProps) => {
  return (
    <div style={{ position: 'absolute', top: 12, left: 12 }}>
      <p>Score: {score}</p>
      <p>Time: {remainingSeconds}</p>
    </div>
  )
}
