import type { Ticker, HolderTypeFilter, Holder, EntityMetrics, HHIScore, Alert, ShareClass, CompareEntity, OwnershipSummary } from '@/types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

async function apiFetch<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${path}`, { next: { revalidate: 60 } })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch {
    console.warn(`[Real Rails] API unreachable — using mock fallback for ${path}`)
    return fallback
  }
}

// ─── Mock fallback data (mirrors backend/data.py) ────────────────────────────

const MOCK_HOLDERS: Record<Ticker, Holder[]> = {
  NVDA: [
    { rank:1, name:'Vanguard Group Inc', type:'institutional', economicPct:28.4, votingPct:22.1, shares:6920000000, changeQoQ:'+1.2%', filingDate:'2024-09-30' },
    { rank:2, name:'BlackRock Inc', type:'institutional', economicPct:19.1, votingPct:15.2, shares:4650000000, changeQoQ:'+0.8%', filingDate:'2024-09-30' },
    { rank:3, name:'State Street Corp', type:'institutional', economicPct:9.3, votingPct:7.4, shares:2265000000, changeQoQ:'-0.3%', filingDate:'2024-09-30' },
    { rank:4, name:'FMR LLC (Fidelity)', type:'institutional', economicPct:8.2, votingPct:6.5, shares:1997000000, changeQoQ:'+0.5%', filingDate:'2024-09-30' },
    { rank:5, name:'Jensen Huang (CEO)', type:'insider', economicPct:7.8, votingPct:18.9, shares:1899000000, changeQoQ:'0.0%', filingDate:'2024-10-01' },
    { rank:6, name:'Capital Group', type:'institutional', economicPct:6.1, votingPct:4.8, shares:1485000000, changeQoQ:'+0.2%', filingDate:'2024-09-30' },
    { rank:7, name:'T. Rowe Price', type:'institutional', economicPct:4.2, votingPct:3.3, shares:1022000000, changeQoQ:'-0.1%', filingDate:'2024-09-30' },
    { rank:8, name:'Norges Bank', type:'institutional', economicPct:3.1, votingPct:2.5, shares:755000000, changeQoQ:'+0.1%', filingDate:'2024-09-30' },
    { rank:9, name:'Geode Capital Mgmt', type:'institutional', economicPct:2.8, votingPct:2.2, shares:681000000, changeQoQ:'0.0%', filingDate:'2024-09-30' },
    { rank:10, name:'Other / Public Float', type:'retail', economicPct:11.0, votingPct:17.1, shares:2678000000, changeQoQ:'N/A', filingDate:'N/A' },
  ],
  GOOG: [
    { rank:1, name:'Larry Page (Co-Founder)', type:'insider', economicPct:25.4, votingPct:31.2, shares:3040000000, changeQoQ:'0.0%', filingDate:'2024-10-01' },
    { rank:2, name:'Sergey Brin (Co-Founder)', type:'insider', economicPct:18.3, votingPct:22.5, shares:2190000000, changeQoQ:'0.0%', filingDate:'2024-10-01' },
    { rank:3, name:'Vanguard Group Inc', type:'institutional', economicPct:14.1, votingPct:10.9, shares:1688000000, changeQoQ:'+0.6%', filingDate:'2024-09-30' },
    { rank:4, name:'BlackRock Inc', type:'institutional', economicPct:8.7, votingPct:6.7, shares:1041000000, changeQoQ:'+0.3%', filingDate:'2024-09-30' },
    { rank:5, name:'T. Rowe Price', type:'institutional', economicPct:5.2, votingPct:4.0, shares:622000000, changeQoQ:'-0.2%', filingDate:'2024-09-30' },
    { rank:6, name:'State Street Corp', type:'institutional', economicPct:4.8, votingPct:3.7, shares:574000000, changeQoQ:'0.0%', filingDate:'2024-09-30' },
    { rank:7, name:'Fidelity Investments', type:'institutional', economicPct:3.9, votingPct:3.0, shares:467000000, changeQoQ:'+0.4%', filingDate:'2024-09-30' },
    { rank:8, name:'Capital Group', type:'institutional', economicPct:3.1, votingPct:2.4, shares:371000000, changeQoQ:'-0.1%', filingDate:'2024-09-30' },
    { rank:9, name:'Wellington Mgmt', type:'institutional', economicPct:2.8, votingPct:2.2, shares:335000000, changeQoQ:'0.0%', filingDate:'2024-09-30' },
    { rank:10, name:'Other / Public Float', type:'retail', economicPct:13.7, votingPct:13.4, shares:1640000000, changeQoQ:'N/A', filingDate:'N/A' },
  ],
  META: [
    { rank:1, name:'Mark Zuckerberg (CEO)', type:'insider', economicPct:13.6, votingPct:56.9, shares:394000000, changeQoQ:'-0.4%', filingDate:'2024-10-01' },
    { rank:2, name:'Vanguard Group Inc', type:'institutional', economicPct:17.8, votingPct:8.2, shares:515000000, changeQoQ:'+0.7%', filingDate:'2024-09-30' },
    { rank:3, name:'BlackRock Inc', type:'institutional', economicPct:12.4, votingPct:5.7, shares:359000000, changeQoQ:'+0.3%', filingDate:'2024-09-30' },
    { rank:4, name:'State Street Corp', type:'institutional', economicPct:6.7, votingPct:3.1, shares:194000000, changeQoQ:'-0.1%', filingDate:'2024-09-30' },
    { rank:5, name:'FMR LLC (Fidelity)', type:'institutional', economicPct:5.9, votingPct:2.7, shares:171000000, changeQoQ:'+0.2%', filingDate:'2024-09-30' },
    { rank:6, name:'Capital Group', type:'institutional', economicPct:4.1, votingPct:1.9, shares:119000000, changeQoQ:'0.0%', filingDate:'2024-09-30' },
    { rank:7, name:'T. Rowe Price', type:'institutional', economicPct:3.8, votingPct:1.8, shares:110000000, changeQoQ:'-0.3%', filingDate:'2024-09-30' },
    { rank:8, name:'Primecap Mgmt', type:'institutional', economicPct:2.9, votingPct:1.3, shares:84000000, changeQoQ:'+0.1%', filingDate:'2024-09-30' },
    { rank:9, name:'Wellington Mgmt', type:'institutional', economicPct:2.4, votingPct:1.1, shares:69000000, changeQoQ:'0.0%', filingDate:'2024-09-30' },
    { rank:10, name:'Other / Public Float', type:'retail', economicPct:30.4, votingPct:17.3, shares:880000000, changeQoQ:'N/A', filingDate:'N/A' },
  ],
  AMZN: [
    { rank:1, name:'Jeff Bezos (Founder)', type:'insider', economicPct:9.4, votingPct:9.4, shares:984000000, changeQoQ:'-0.6%', filingDate:'2024-10-01' },
    { rank:2, name:'Vanguard Group Inc', type:'institutional', economicPct:18.1, votingPct:18.1, shares:1895000000, changeQoQ:'+0.5%', filingDate:'2024-09-30' },
    { rank:3, name:'BlackRock Inc', type:'institutional', economicPct:11.3, votingPct:11.3, shares:1183000000, changeQoQ:'+0.4%', filingDate:'2024-09-30' },
    { rank:4, name:'State Street Corp', type:'institutional', economicPct:5.8, votingPct:5.8, shares:607000000, changeQoQ:'-0.2%', filingDate:'2024-09-30' },
    { rank:5, name:'Andy Jassy (CEO)', type:'insider', economicPct:2.1, votingPct:2.1, shares:220000000, changeQoQ:'0.0%', filingDate:'2024-10-01' },
    { rank:6, name:'FMR LLC (Fidelity)', type:'institutional', economicPct:5.4, votingPct:5.4, shares:565000000, changeQoQ:'+0.3%', filingDate:'2024-09-30' },
    { rank:7, name:'Capital Group', type:'institutional', economicPct:4.2, votingPct:4.2, shares:440000000, changeQoQ:'0.0%', filingDate:'2024-09-30' },
    { rank:8, name:'Geode Capital Mgmt', type:'institutional', economicPct:3.3, votingPct:3.3, shares:345000000, changeQoQ:'+0.1%', filingDate:'2024-09-30' },
    { rank:9, name:'T. Rowe Price', type:'institutional', economicPct:2.9, votingPct:2.9, shares:304000000, changeQoQ:'-0.1%', filingDate:'2024-09-30' },
    { rank:10, name:'Other / Public Float', type:'retail', economicPct:37.5, votingPct:37.5, shares:3928000000, changeQoQ:'N/A', filingDate:'N/A' },
  ],
}

const MOCK_METRICS: Record<Ticker, EntityMetrics> = {
  NVDA: { ticker:'NVDA', companyName:'NVIDIA Corporation', top1Holder:'Vanguard Group', top1EconomicPct:28.4, top1VotingPct:22.1, hhi:2841, shareClasses:3, insiderEconomicPct:19.2, insiderVotingPct:34.1, voteEquityRatio:1.42, alertLevel:'MEDIUM', top3Combined:67.4 },
  GOOG: { ticker:'GOOG', companyName:'Alphabet Inc', top1Holder:'Larry Page', top1EconomicPct:25.4, top1VotingPct:31.2, hhi:3104, shareClasses:3, insiderEconomicPct:43.7, insiderVotingPct:53.7, voteEquityRatio:1.73, alertLevel:'HIGH', top3Combined:64.6 },
  META: { ticker:'META', companyName:'Meta Platforms Inc', top1Holder:'Mark Zuckerberg', top1EconomicPct:13.6, top1VotingPct:56.9, hhi:3512, shareClasses:2, insiderEconomicPct:13.6, insiderVotingPct:56.9, voteEquityRatio:4.18, alertLevel:'CRITICAL', top3Combined:43.8 },
  AMZN: { ticker:'AMZN', companyName:'Amazon.com Inc', top1Holder:'Vanguard Group', top1EconomicPct:18.1, top1VotingPct:18.1, hhi:1843, shareClasses:1, insiderEconomicPct:11.5, insiderVotingPct:11.5, voteEquityRatio:1.00, alertLevel:'LOW', top3Combined:38.8 },
}

const MOCK_HHI: HHIScore[] = [
  { ticker:'NVDA', companyName:'NVIDIA Corp', hhi:2841, aboveThreshold:true, threshold:2500, alertLevel:'MEDIUM' },
  { ticker:'GOOG', companyName:'Alphabet Inc', hhi:3104, aboveThreshold:true, threshold:2500, alertLevel:'HIGH' },
  { ticker:'META', companyName:'Meta Platforms', hhi:3512, aboveThreshold:true, threshold:2500, alertLevel:'CRITICAL' },
  { ticker:'AMZN', companyName:'Amazon.com', hhi:1843, aboveThreshold:false, threshold:2500, alertLevel:'LOW' },
]

const MOCK_ALERTS: Alert[] = [
  { ticker:'META', level:'CRITICAL', color:'#F87171', title:'Founder Super-Voting Control', message:'Mark Zuckerberg controls 56.9% of voting power via Class B shares while holding only 13.6% of economic equity. Vote-to-equity ratio: 4.18×. Board override risk is EXTREME. Minority shareholders hold zero practical veto power.', source:'SEC Form DEF 14A · Synthetic Class B multiplier per Real Rails Protocol' },
  { ticker:'GOOG', level:'HIGH', color:'#FBBF24', title:'Dual-Class Founder Concentration', message:'Dual-class structure gives Page + Brin 53.7% combined voting control. Class C shareholders (GOOG) hold zero votes — fully non-participatory economic instruments. Voting-to-equity premium: 1.73×.', source:'SEC Form DEF 14A · OpenCorporates entity filing' },
  { ticker:'NVDA', level:'MEDIUM', color:'#818CF8', title:'Institutional Concentration Above SEC Threshold', message:'HHI concentration index at 2,841 — 13.6% above the SEC institutional threshold of 2,500. Top 3 holders (Vanguard, BlackRock, State Street) represent a de-facto blocking coalition with 56.8% combined.', source:'SEC 13F filings · Computed HHI' },
  { ticker:'AMZN', level:'LOW', color:'#34D399', title:'Single-Class — Within Normal Range', message:"Amazon operates a single share class. Economic ownership and voting power are 1:1. HHI = 1,843, below the 2,500 threshold. Bezos' stake has declined from ~16% at IPO. No blocking coalition detected.", source:'SEC 13F filings' },
]

const MOCK_SHARE_CLASSES: Record<Ticker, ShareClass[]> = {
  NVDA: [
    { class:'A', votesPerShare:1, description:'Public market float', pct:61, synthetic:false },
    { class:'B', votesPerShare:10, description:'Founder / insider controlled', pct:21, synthetic:true },
    { class:'C', votesPerShare:0, description:'Non-voting economic interest', pct:18, synthetic:true },
  ],
  GOOG: [
    { class:'A', votesPerShare:1, description:'Public (GOOGL ticker)', pct:47, synthetic:false },
    { class:'B', votesPerShare:10, description:'Founders / early insiders, not publicly traded', pct:17, synthetic:true },
    { class:'C', votesPerShare:0, description:'Non-voting (GOOG ticker)', pct:36, synthetic:false },
  ],
  META: [
    { class:'A', votesPerShare:1, description:'Public market float', pct:86, synthetic:false },
    { class:'B', votesPerShare:10, description:'Zuckerberg — 10 votes/share', pct:14, synthetic:true },
  ],
  AMZN: [
    { class:'Common', votesPerShare:1, description:'Single class — all shareholders equal', pct:100, synthetic:false },
  ],
}

const MOCK_COMPARE: CompareEntity[] = [
  { ticker:'NVDA', companyName:'NVIDIA Corporation', top1EconomicHolder:'Vanguard Group', top1EconomicPct:28.4, top1VotingHolder:'Jensen Huang', top1VotingPct:22.1, hhi:2841, shareClasses:3, insiderEconomicPct:19.2, insiderVotingPct:34.1, voteEquityRatio:1.42, alertLevel:'MEDIUM', marketCapB:3200 },
  { ticker:'GOOG', companyName:'Alphabet Inc', top1EconomicHolder:'Larry Page', top1EconomicPct:25.4, top1VotingHolder:'Larry Page', top1VotingPct:31.2, hhi:3104, shareClasses:3, insiderEconomicPct:43.7, insiderVotingPct:53.7, voteEquityRatio:1.73, alertLevel:'HIGH', marketCapB:2100 },
  { ticker:'META', companyName:'Meta Platforms Inc', top1EconomicHolder:'Vanguard Group', top1EconomicPct:17.8, top1VotingHolder:'Mark Zuckerberg', top1VotingPct:56.9, hhi:3512, shareClasses:2, insiderEconomicPct:13.6, insiderVotingPct:56.9, voteEquityRatio:4.18, alertLevel:'CRITICAL', marketCapB:1580 },
  { ticker:'AMZN', companyName:'Amazon.com Inc', top1EconomicHolder:'Vanguard Group', top1EconomicPct:18.1, top1VotingHolder:'Vanguard Group', top1VotingPct:18.1, hhi:1843, shareClasses:1, insiderEconomicPct:11.5, insiderVotingPct:11.5, voteEquityRatio:1.00, alertLevel:'LOW', marketCapB:2050 },
]

const MOCK_SUMMARY: OwnershipSummary = {
  rail: 'Capital Formation',
  pocTitle: 'Ownership Concentration Dashboard',
  sidebarA: { stat:'67.4%', statLabel:'voting control in top 3 holders (median large-cap tech)', thesis:'Control sits in the rails. A direct expression of how decision-making power is distributed among founders, investors, and different share classes.' },
  sidebarB: { title:'Why This Matters', body:'Majority shareholders with super-voting shares can override minority investors, direct M&A, and set capital allocation with no quorum risk. Disclosed economic stakes systematically understate actual decision-making power when dual-class structures are in play.', keyStat:'1.42×', keyStatLabel:'Average vote-to-equity premium across tracked entities' },
  sidebarC: { title:'Who Controls the Rail', body:'This project analyzes how decision-making power is distributed among founders, investors, and different share classes within a company.', breakdown: [{ label:'Institutional', pct:52.1, color:'cyan' },{ label:'Insiders / Founders', pct:19.2, color:'warning' },{ label:'Retail / Public Float', pct:22.4, color:'muted' },{ label:'Other / Unknown', pct:6.3, color:'dim' }] },
  dataSources: ['SEC EDGAR','OpenCorporates'],
  syntheticNote: 'Voting rights and ownership classes are synthetic where SEC disclosure is incomplete',
  lastUpdated: '2025-01-15',
  dataMode: 'mock',
}

// ─── Public adapter functions ─────────────────────────────────────────────────

export async function fetchHolders(ticker: Ticker, holderType: HolderTypeFilter = 'all'): Promise<Holder[]> {
  const data = await apiFetch<{ holders: Holder[] }>(
    `/v1/ownership/holders?ticker=${ticker}&holder_type=${holderType}`,
    { holders: MOCK_HOLDERS[ticker] }
  )
  let holders = data.holders
  if (holderType === 'institutional') holders = holders.filter(h => h.type === 'institutional')
  if (holderType === 'insider') holders = holders.filter(h => h.type === 'insider')
  return holders
}

export async function fetchMetrics(ticker: Ticker): Promise<EntityMetrics> {
  return apiFetch<EntityMetrics>(`/v1/ownership/metrics?ticker=${ticker}`, MOCK_METRICS[ticker])
}

export async function fetchHHI(): Promise<HHIScore[]> {
  const data = await apiFetch<{ scores: HHIScore[] }>('/v1/ownership/hhi', { scores: MOCK_HHI })
  return data.scores
}

export async function fetchAlerts(): Promise<Alert[]> {
  const data = await apiFetch<{ alerts: Alert[] }>('/v1/ownership/alerts', { alerts: MOCK_ALERTS })
  return data.alerts
}

export async function fetchShareClasses(ticker: Ticker): Promise<ShareClass[]> {
  const data = await apiFetch<{ classes: ShareClass[] }>(`/v1/ownership/share-classes?ticker=${ticker}`, { classes: MOCK_SHARE_CLASSES[ticker] })
  return data.classes
}

export async function fetchCompare(): Promise<CompareEntity[]> {
  const data = await apiFetch<{ entities: CompareEntity[] }>('/v1/ownership/compare', { entities: MOCK_COMPARE })
  return data.entities
}

export async function fetchSummary(): Promise<OwnershipSummary> {
  return apiFetch<OwnershipSummary>('/v1/ownership/summary', MOCK_SUMMARY)
}

export function downloadExportJSON() {
  const data = {
    _meta: { source:'Real Rails Intelligence Library', rail:'Capital Formation', generated:'2025-01-15', note:'Synthetic voting rights per Real Rails Protocol. Economic data derived from SEC EDGAR / OpenCorporates.' },
    ownership_snapshot: Object.entries(MOCK_HOLDERS).map(([ticker, holders]) => ({ ticker, holders })),
    hhi_scores: MOCK_HHI,
    voting_rights: MOCK_SHARE_CLASSES,
    alerts: MOCK_ALERTS,
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'real_rails_ownership_sample.json'
  a.click()
}