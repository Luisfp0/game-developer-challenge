import { useState } from 'react'
import { OptionsForm } from '../../components/OptionsForm'
import { fieldErrors, optionsFromFields, readOptions, writeOptions } from '../../game/options'
import type { OptionsPageProps } from './types'

export const OptionsPage = ({ onBack }: OptionsPageProps) => {
  const [matchSeconds, setMatchSeconds] = useState(() => String(readOptions(localStorage).matchSeconds))
  const [spawnIntervalSeconds, setSpawnIntervalSeconds] = useState(() =>
    String(readOptions(localStorage).spawnIntervalSeconds),
  )
  const errors = fieldErrors(matchSeconds, spawnIntervalSeconds)

  const save = () => {
    const next = optionsFromFields(matchSeconds, spawnIntervalSeconds)
    if (!next) return
    writeOptions(localStorage, next)
    onBack()
  }

  return (
    <OptionsForm
      matchSeconds={matchSeconds}
      spawnIntervalSeconds={spawnIntervalSeconds}
      matchSecondsError={errors.matchSeconds}
      spawnIntervalSecondsError={errors.spawnIntervalSeconds}
      onMatchSecondsChange={setMatchSeconds}
      onSpawnIntervalSecondsChange={setSpawnIntervalSeconds}
      onSave={save}
      onBack={onBack}
    />
  )
}
