import type { OptionsStorage } from '../../game/options'
import { NETWORK_SCENARIO_KEY, NETWORK_SCENARIOS } from './constants'
import type { NetworkScenario } from './types'

export { NETWORK_SCENARIO_KEY, NETWORK_SCENARIOS }
export type { NetworkScenario }

export const readScenario = (storage: OptionsStorage): NetworkScenario => {
  const raw = storage.getItem(NETWORK_SCENARIO_KEY)
  if (raw && NETWORK_SCENARIOS.includes(raw as NetworkScenario)) return raw as NetworkScenario
  return 'success'
}

export const writeScenario = (storage: OptionsStorage, scenario: NetworkScenario): void => {
  storage.setItem(NETWORK_SCENARIO_KEY, scenario)
}
