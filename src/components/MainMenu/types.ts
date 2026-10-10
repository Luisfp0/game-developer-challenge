import type { NetworkScenario } from '../../mocks/scenarios'

export type MainMenuProps = {
  error: string | null
  scenario: NetworkScenario
  onPlay: () => void
  onOptions: () => void
  onRanking: () => void
  onHistory: () => void
  onScenario: (scenario: NetworkScenario) => void
  onResetRecords: () => void
}
