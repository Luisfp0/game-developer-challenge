import type { OptionsFormProps } from './types'

const fieldStyle = { display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'left' } as const

export function OptionsForm({
  matchSeconds,
  spawnIntervalSeconds,
  matchSecondsError,
  spawnIntervalSecondsError,
  onMatchSecondsChange,
  onSpawnIntervalSecondsChange,
  onSave,
  onBack,
}: OptionsFormProps) {
  const invalid = matchSecondsError !== null || spawnIntervalSecondsError !== null

  return (
    <main style={{ maxWidth: 420, margin: '10vh auto', textAlign: 'center' }}>
      <h1>Options</h1>
      <form
        style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
        onSubmit={(event) => {
          event.preventDefault()
          if (!invalid) onSave()
        }}
      >
        <div style={fieldStyle}>
          <label htmlFor="game-session-time">Game session time</label>
          <input
            id="game-session-time"
            value={matchSeconds}
            aria-invalid={matchSecondsError !== null}
            aria-describedby={matchSecondsError ? 'game-session-time-error' : undefined}
            onChange={(event) => onMatchSecondsChange(event.target.value)}
          />
          {matchSecondsError ? (
            <span id="game-session-time-error" role="alert">
              {matchSecondsError}
            </span>
          ) : null}
        </div>
        <div style={fieldStyle}>
          <label htmlFor="enemy-spawn-time">Enemy spawn time</label>
          <input
            id="enemy-spawn-time"
            value={spawnIntervalSeconds}
            aria-invalid={spawnIntervalSecondsError !== null}
            aria-describedby={spawnIntervalSecondsError ? 'enemy-spawn-time-error' : undefined}
            onChange={(event) => onSpawnIntervalSecondsChange(event.target.value)}
          />
          {spawnIntervalSecondsError ? (
            <span id="enemy-spawn-time-error" role="alert">
              {spawnIntervalSecondsError}
            </span>
          ) : null}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
          <button type="submit" disabled={invalid}>
            Save
          </button>
          <button type="button" onClick={onBack}>
            Back
          </button>
        </div>
      </form>
    </main>
  )
}
