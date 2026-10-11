import { GAME_CONFIG } from '../../constants/gameConfig'
import { GoldButton, NumberStepper, Screen } from '../ui'
import type { OptionsFormProps } from './types'

export const OptionsForm = ({
  matchSeconds,
  spawnIntervalSeconds,
  matchSecondsError,
  spawnIntervalSecondsError,
  onMatchSecondsChange,
  onSpawnIntervalSecondsChange,
  onSave,
  onBack,
}: OptionsFormProps) => {
  const invalid = matchSecondsError !== null || spawnIntervalSecondsError !== null

  return (
    <Screen>
      <h1>Options</h1>
      <form
        className="button-stack"
        onSubmit={(event) => {
          event.preventDefault()
          if (!invalid) onSave()
        }}
      >
        <NumberStepper
          id="game-session-time"
          label="Game session time"
          value={matchSeconds}
          min={GAME_CONFIG.matchSecondsMin}
          max={GAME_CONFIG.matchSecondsMax}
          step={10}
          error={matchSecondsError}
          onChange={onMatchSecondsChange}
        />
        <NumberStepper
          id="enemy-spawn-time"
          label="Enemy spawn time"
          value={spawnIntervalSeconds}
          min={GAME_CONFIG.spawnIntervalMin}
          max={GAME_CONFIG.spawnIntervalMax}
          step={1}
          error={spawnIntervalSecondsError}
          onChange={onSpawnIntervalSecondsChange}
        />
        <GoldButton type="submit" disabled={invalid}>
          Save
        </GoldButton>
        <GoldButton type="button" variant="secondary" onClick={onBack}>
          Back
        </GoldButton>
      </form>
    </Screen>
  )
}
