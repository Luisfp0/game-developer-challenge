import type { LastMatch } from '../../game/lastMatch'

export type MatchHistoryProps = {
  matches: LastMatch[]
  onBack: () => void
}
