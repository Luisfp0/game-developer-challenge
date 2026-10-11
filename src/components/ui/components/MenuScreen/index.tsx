import type { MenuScreenProps } from './types'

export const MenuScreen = ({ panel, below }: MenuScreenProps) => {
  return (
    <div className="screen">
      <div className="menu-stack">
        <div className="panel">{panel}</div>
        {below}
      </div>
    </div>
  )
}
