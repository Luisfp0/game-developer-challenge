import type { OptionsStorage } from '../game/options'

export const NETWORK_SCENARIO_KEY = 'pirate-battle-network'

export const NETWORK_SCENARIOS = ['success', 'empty', 'slow', 'timeout', 'error'] as const

export type NetworkScenario = (typeof NETWORK_SCENARIOS)[number]

export const readScenario = (storage: OptionsStorage): NetworkScenario => {
  const raw = storage.getItem(NETWORK_SCENARIO_KEY)
  if (raw && NETWORK_SCENARIOS.includes(raw as NetworkScenario)) return raw as NetworkScenario
  return 'success'
}

export const writeScenario = (storage: OptionsStorage, scenario: NetworkScenario): void => {
  storage.setItem(NETWORK_SCENARIO_KEY, scenario)
}
