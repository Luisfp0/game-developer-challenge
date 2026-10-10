import { CONTROL_HINTS } from '../../constants/controls'
import type { MainMenuProps } from './types'

export function MainMenu({ error, onPlay }: MainMenuProps) {
  return (
    <main style={{ maxWidth: 420, margin: '10vh auto', textAlign: 'center' }}>
      <h1>Pirate Battle</h1>
      <ul style={{ textAlign: 'left' }}>
        {CONTROL_HINTS.map((hint) => (
          <li key={hint}>{hint}</li>
        ))}
      </ul>
      {error ? <p role="alert">{error}</p> : null}
      <button type="button" onClick={onPlay}>
        {error ? 'Try again' : 'Play'}
      </button>
    </main>
  )
}
