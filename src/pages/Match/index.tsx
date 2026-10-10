import { useEffect, useRef, useState } from 'react'
import { GameCanvas } from '../../components/GameCanvas'
import { Hud } from '../../components/Hud'
import { PauseOverlay } from '../../components/PauseOverlay'
import { TouchControls } from '../../components/TouchControls'
import { useKeyboard } from '../../hooks/useKeyboard'
import { useTouchControls } from '../../hooks/useTouchControls'
import type { MatchSnapshot } from '../../types/game'

type MatchPageProps = {
  score: number
  remainingSeconds: number
  onSnapshot: (snapshot: MatchSnapshot) => void
  onLoadError: (message: string) => void
}

export function MatchPage({ score, remainingSeconds, onSnapshot, onLoadError }: MatchPageProps) {
  const [paused, setPaused] = useState(false)
  const pausedRef = useRef(false)
  const keyboard = useKeyboard(pausedRef)
  const touch = useTouchControls(pausedRef)
  const pauseRef = useRef(() => {})

  pauseRef.current = () => {
    if (pausedRef.current) return
    pausedRef.current = true
    keyboard.clear()
    touch.clear()
    setPaused(true)
  }

  function resume() {
    pausedRef.current = false
    setPaused(false)
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Escape') return
      event.preventDefault()
      pauseRef.current()
    }
    const onBlur = () => {
      pauseRef.current()
    }
    const onVisibility = () => {
      if (document.hidden) pauseRef.current()
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('blur', onBlur)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('blur', onBlur)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <GameCanvas
        onSnapshot={onSnapshot}
        onLoadError={onLoadError}
        pausedRef={pausedRef}
        keyboardRef={keyboard.controls}
        touchRef={touch.input}
      />
      <Hud score={score} remainingSeconds={remainingSeconds} />
      <button type="button" onClick={() => pauseRef.current()} style={{ position: 'absolute', top: 12, right: 12, zIndex: 2 }}>
        Pause
      </button>
      {touch.narrow ? (
        <TouchControls
          onStick={touch.setStick}
          onFire={touch.setFire}
          onFireLeft={touch.setFireLeft}
          onFireRight={touch.setFireRight}
        />
      ) : null}
      {paused ? <PauseOverlay onResume={resume} /> : null}
    </div>
  )
}
