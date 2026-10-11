import type { ScreenProps } from './types'

export const Screen = ({ children, wide = false }: ScreenProps) => {
  return (
    <div className="screen">
      <div className={wide ? 'panel panel-wide' : 'panel'}>{children}</div>
    </div>
  )
}
