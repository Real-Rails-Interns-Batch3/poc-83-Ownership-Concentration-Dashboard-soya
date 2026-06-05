export type AlertLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
export type HolderType = 'institutional' | 'insider' | 'retail'
export type HolderTypeFilter = 'all' | 'institutional' | 'insider'
export type Ticker = 'NVDA' | 'GOOG' | 'META' | 'AMZN'
export type TabId = 'concentration' | 'voting' | 'compare' | 'alerts' | 'intelligence'

export interface Holder {
  rank: number
  name: string
  type: HolderType
  economicPct: number
  votingPct: number
  shares: number
  changeQoQ: string
  filingDate: string
}

export interface EntityMetrics {
  ticker: string
  companyName: string
  top1Holder: string
  top1EconomicPct: number
  top1VotingPct: number
  hhi: number
  shareClasses: number
  insiderEconomicPct: number
  insiderVotingPct: number
  voteEquityRatio: number
  alertLevel: AlertLevel
  top3Combined: number
}

export interface HHIScore {
  ticker: string
  companyName: string
  hhi: number
  aboveThreshold: boolean
  threshold: number
  alertLevel: AlertLevel
}

export interface Alert {
  ticker: string
  level: AlertLevel
  color: string
  title: string
  message: string
  source: string
}

export interface ShareClass {
  class: string
  votesPerShare: number
  description: string
  pct: number
  synthetic: boolean
}

export interface CompareEntity {
  ticker: string
  companyName: string
  top1EconomicHolder: string
  top1EconomicPct: number
  top1VotingHolder: string
  top1VotingPct: number
  hhi: number
  shareClasses: number
  insiderEconomicPct: number
  insiderVotingPct: number
  voteEquityRatio: number
  alertLevel: AlertLevel
  marketCapB: number
}

export interface SummaryBreakdownItem {
  label: string
  pct: number
  color: string
}

export interface OwnershipSummary {
  rail: string
  pocTitle: string
  sidebarA: { stat: string; statLabel: string; thesis: string }
  sidebarB: { title: string; body: string; keyStat: string; keyStatLabel: string }
  sidebarC: { title: string; body: string; breakdown: SummaryBreakdownItem[] }
  dataSources: string[]
  syntheticNote: string
  lastUpdated: string
  dataMode: string
}