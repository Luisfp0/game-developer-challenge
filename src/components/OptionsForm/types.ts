export type OptionsFormProps = {
  matchSeconds: string
  spawnIntervalSeconds: string
  matchSecondsError: string | null
  spawnIntervalSecondsError: string | null
  onMatchSecondsChange: (value: string) => void
  onSpawnIntervalSecondsChange: (value: string) => void
  onSave: () => void
  onBack: () => void
}
