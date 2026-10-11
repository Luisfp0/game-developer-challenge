export type LogTab = 'ranking' | 'history'

export type LogPageProps = {
  tab: LogTab
  onTab: (tab: LogTab) => void
  onBack: () => void
}
