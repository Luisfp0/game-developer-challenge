import { CONTROL_HINTS } from '../../constants/controls'
import { NETWORK_SCENARIOS, type NetworkScenario } from '../../mocks/scenarios'
import { UI_ASSETS } from '../ui/assets'
import { GoldButton, MenuScreen, SelectField } from '../ui'
import type { MainMenuProps } from './types'

const SCENARIO_LABEL: Record<NetworkScenario, string> = {
  success: 'Success',
  empty: 'Empty',
  slow: 'Slow',
  timeout: 'Timeout',
  error: 'Error',
}

export const MainMenu = ({
  error,
  scenario,
  onPlay,
  onOptions,
  onRanking,
  onHistory,
  onScenario,
  onResetRecords,
}: MainMenuProps) => {
  return (
    <MenuScreen
      panel={
        <>
          <h1 className="title-heading">
            <img src={UI_ASSETS.title} alt="Pirate Battle" />
          </h1>
          <p className="tagline">Set sail. Take command.</p>
          {error ? <p role="alert">{error}</p> : null}
          <div className="button-stack">
            <GoldButton type="button" onClick={onPlay}>
              {error ? 'Try again' : 'Play'}
            </GoldButton>
            <GoldButton type="button" onClick={onOptions}>
              Options
            </GoldButton>
          </div>
          <p>Navigate the islands. Survive the battle.</p>
          <ul className="control-hints">
            {CONTROL_HINTS.map((hint) => (
              <li key={hint}>{hint}</li>
            ))}
          </ul>
          <div className="button-row">
            <GoldButton type="button" compact onClick={onRanking}>
              Ranking
            </GoldButton>
            <GoldButton type="button" compact onClick={onHistory}>
              Match History
            </GoldButton>
          </div>
        </>
      }
      below={
        <div className="scenario-bar">
          <SelectField
            id="network-scenario"
            label="Network scenario"
            value={scenario}
            onChange={(event) => onScenario(event.target.value as NetworkScenario)}
          >
            {NETWORK_SCENARIOS.map((item) => (
              <option key={item} value={item}>
                {SCENARIO_LABEL[item]}
              </option>
            ))}
          </SelectField>
          <GoldButton type="button" compact onClick={onResetRecords}>
            Reset records
          </GoldButton>
        </div>
      }
    />
  )
}
