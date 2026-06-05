'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { CompareEntity } from '@/types'
import { ChartTitle, ChartLegend } from './ConcentrationTab'

interface CompareTabProps { entities: CompareEntity[] }

const ALERT_COLOR: Record<string, string> = {
  CRITICAL: '#F87171',
  HIGH:     '#FBBF24',
  MEDIUM:   '#818CF8',
  LOW:      '#34D399',
}

// Fixed: format market cap correctly — values are already in $B (e.g. 3200 → "$3,200B")
function fmtCap(b: number): string {
  return `$${b.toLocaleString()}B`
}

// Fixed: format percent with one decimal
function fmtPct(n: number): string {
  return `${n.toFixed(1)}%`
}

// Custom tooltip for all comparison charts
function CompareTooltip({
  active, payload, label, labelA, labelB,
}: {
  active?: boolean
  payload?: { value: number; name: string; fill: string }[]
  label?: string
  labelA: string
  labelB: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#0B1117', border: '1px solid #1F2937', borderRadius: 4, padding: '8px 12px', fontSize: 12 }}>
      <div style={{ color: '#94A3B8', fontFamily: 'Space Mono', fontSize: 10, marginBottom: 5 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.fill, fontFamily: 'Space Mono', marginBottom: 2 }}>
          {i === 0 ? labelA : labelB}: {p.value.toFixed(1)}%
        </div>
      ))}
    </div>
  )
}

export function CompareTab({ entities }: CompareTabProps) {
  const topHolderData = entities.map(e => ({
    ticker:   e.ticker,
    economic: +e.top1EconomicPct.toFixed(1),
    voting:   +e.top1VotingPct.toFixed(1),
  }))

  const insiderData = entities.map(e => ({
    ticker:      e.ticker,
    insiderEcon: +e.insiderEconomicPct.toFixed(1),
    insiderVote: +e.insiderVotingPct.toFixed(1),
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, animation: 'fadeIn 0.3s ease' }}>

      <div className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        Side-by-side Entity Comparison — Capital Formation Profile
      </div>

      {/* Entity cards 2×2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {entities.map(e => {
          const col = ALERT_COLOR[e.alertLevel]
          const isHighlighted = e.alertLevel === 'CRITICAL' || e.alertLevel === 'HIGH'
          return (
            <div key={e.ticker} style={{
              background: 'var(--surface2)',
              border: `1px solid ${isHighlighted ? col + '50' : 'var(--border)'}`,
              borderTop: `2px solid ${col}`,
              borderRadius: 5, padding: 14,
            }}>
              {/* Card header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <div className="font-mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {e.ticker}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{e.companyName}</div>
                </div>
                <span style={{
                  padding: '2px 8px', borderRadius: 3, fontSize: 9, fontFamily: 'Space Mono',
                  background: `${col}18`, color: col,
                  border: `1px solid ${col}44`, letterSpacing: '0.08em',
                }}>
                  {e.alertLevel}
                </span>
              </div>

              {/* Data rows */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {[
                  {
                    key: 'Top Econ. Holder',
                    val: fmtPct(e.top1EconomicPct),
                    sub: e.top1EconomicHolder,
                  },
                  {
                    key: 'Top Vote Holder',
                    val: fmtPct(e.top1VotingPct),
                    sub: e.top1VotingHolder,
                    highlight: e.top1VotingPct > 40,
                  },
                  {
                    key: 'HHI Score',
                    val: e.hhi.toLocaleString(),
                    flag: e.hhi > 2500,
                  },
                  { key: 'Share Classes', val: String(e.shareClasses) },
                  { key: 'Insider Economic', val: fmtPct(e.insiderEconomicPct) },
                  {
                    key: 'Insider Voting',
                    val: fmtPct(e.insiderVotingPct),
                    highlight: e.insiderVotingPct > 30,
                  },
                  {
                    key: 'Vote/Equity Ratio',
                    val: `${e.voteEquityRatio.toFixed(2)}×`,
                    flag: e.voteEquityRatio > 2,
                  },
                  // Fixed: marketCapB is already numeric billions — format as $3,200B not $32008B
                  { key: 'Market Cap', val: fmtCap(e.marketCapB) },
                ].map(row => (
                  <div
                    key={row.key}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                      padding: '4px 0', borderBottom: '1px solid #0f1923', fontSize: 11,
                    }}
                  >
                    <span style={{ color: 'var(--text-muted)', flexShrink: 0, marginRight: 8 }}>{row.key}</span>
                    <div style={{ textAlign: 'right' }}>
                      <span className="font-mono" style={{
                        color: row.flag ? 'var(--danger)' : row.highlight ? 'var(--warning)' : 'var(--text-primary)',
                      }}>
                        {row.val}
                      </span>
                      {row.sub && (
                        <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 1 }}>{row.sub}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Data source footer per card */}
              <div style={{ marginTop: 8, fontSize: 9, color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.5 }}>
                Sources: SEC EDGAR 13F · OpenCorporates · {e.shareClasses > 1 ? 'SEC DEF 14A (synthetic voting)' : 'Single-class, no synthetic data'}
              </div>
            </div>
          )
        })}
      </div>

      {/* Top holder economic vs voting chart */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: 16 }}>
        <ChartTitle>Top Holder % Comparison — Economic vs Voting Across Entities</ChartTitle>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={topHolderData} margin={{ top: 4, right: 8, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
            <XAxis dataKey="ticker" tick={{ fill: '#64748B', fontSize: 11, fontFamily: 'Space Mono' }} />
            <YAxis tick={{ fill: '#64748B', fontSize: 10 }} tickFormatter={v => `${v}%`} domain={[0, 65]} />
            <Tooltip
              content={
                <CompareTooltip
                  labelA="Top Economic Holder"
                  labelB="Top Voting Holder"
                />
              }
            />
            <Bar dataKey="economic" fill="rgba(56,189,248,0.8)"  stroke="#38BDF8" strokeWidth={1} radius={[2,2,0,0]} name="economic" />
            <Bar dataKey="voting"   fill="rgba(248,113,113,0.8)" stroke="#F87171" strokeWidth={1} radius={[2,2,0,0]} name="voting"   />
          </BarChart>
        </ResponsiveContainer>
        <ChartLegend items={[
          { color: '#38BDF8', label: 'Top Economic Holder %' },
          { color: '#F87171', label: 'Top Voting Holder %' },
        ]} />
      </div>

      {/* Insider economic vs voting chart */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: 16 }}>
        <ChartTitle>Insider Economic vs Insider Voting Control — By Entity</ChartTitle>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={insiderData} margin={{ top: 4, right: 8, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
            <XAxis dataKey="ticker" tick={{ fill: '#64748B', fontSize: 11, fontFamily: 'Space Mono' }} />
            <YAxis tick={{ fill: '#64748B', fontSize: 10 }} tickFormatter={v => `${v}%`} domain={[0, 65]} />
            <Tooltip
              content={
                <CompareTooltip
                  labelA="Insider Economic"
                  labelB="Insider Voting"
                />
              }
            />
            <Bar dataKey="insiderEcon" fill="rgba(251,191,36,0.75)" stroke="#FBBF24" strokeWidth={1} radius={[2,2,0,0]} name="insiderEcon" />
            <Bar dataKey="insiderVote" fill="rgba(248,113,113,0.75)" stroke="#F87171" strokeWidth={1} radius={[2,2,0,0]} name="insiderVote" />
          </BarChart>
        </ResponsiveContainer>
        <ChartLegend items={[
          { color: '#FBBF24', label: 'Insider Economic %' },
          { color: '#F87171', label: 'Insider Voting %' },
        ]} />
      </div>

    </div>
  )
}
