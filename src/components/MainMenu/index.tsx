import { CONTROL_HINTS } from '../../constants/controls'
import type { MainMenuProps } from './types'

export function MainMenu({ error, onPlay, onOptions }: MainMenuProps) {
  return (
    <main style={{ maxWidth: 420, margin: '10vh auto', textAlign: 'center' }}>
      <h1>Pirate Battle</h1>
      <ul style={{ textAlign: 'left' }}>
        {CONTROL_HINTS.map((hint) => (
          <li key={hint}>{hint}</li>
        ))}
      </ul>
      {error ? <p role="alert">{error}</p> : null}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
        <button type="button" onClick={onPlay}>
          {error ? 'Try again' : 'Play'}
        </button>
        <button type="button" onClick={onOptions}>
          Options
        </button>
      </div>
    </main>
  )
}
