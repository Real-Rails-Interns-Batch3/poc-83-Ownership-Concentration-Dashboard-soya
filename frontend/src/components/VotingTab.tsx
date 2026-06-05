'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ReferenceLine } from 'recharts'
import type { Holder, ShareClass, EntityMetrics } from '@/types'
import { MetricCard, ChartTitle, ChartLegend } from './ConcentrationTab'

interface VotingTabProps {
  holders: Holder[]
  shareClasses: ShareClass[]
  metrics: EntityMetrics | null
}

// Fixed: Class C uses a visible mid-grey, not near-invisible #1F2937
const DONUT_COLORS = ['#38BDF8', '#818CF8', '#64748B', '#34D399']

export function VotingTab({ holders, shareClasses, metrics }: VotingTabProps) {
  const top9 = holders.slice(0, 9)

  const chartData = top9.map(h => ({
    name: h.name.split(' ')[0],
    fullName: h.name,
    economic: +h.economicPct.toFixed(1),
    voting:   +h.votingPct.toFixed(1),
    // Fixed: correct arithmetic — voting minus economic; positive = super-voter
    premium:  +(h.votingPct - h.economicPct).toFixed(1),
    type: h.type,
  }))

  const donutData = shareClasses.map((c, i) => ({
    name: `Class ${c.class}`,
    value: c.pct,
    color: DONUT_COLORS[i % DONUT_COLORS.length],
    ...c,
  }))

  // Fixed: compute correct top-5 sums (only from actual top9 slice)
  const top5VotingSum   = top9.slice(0, 5).reduce((a, h) => a + h.votingPct, 0)
  const top5EconomicSum = top9.slice(0, 5).reduce((a, h) => a + h.economicPct, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, animation: 'fadeIn 0.3s ease' }}>

      {/* Metrics row */}
      {metrics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          <MetricCard label="VOTING PWR TOP 5"  value={`${top5VotingSum.toFixed(1)}%`}            sub="of all votes cast"      color="danger"  />
          <MetricCard label="ECONOMIC TOP 5"     value={`${top5EconomicSum.toFixed(1)}%`}          sub="of equity"             color="cyan"    />
          <MetricCard label="VOTE/EQUITY RATIO"  value={`${metrics.voteEquityRatio.toFixed(2)}×`} sub="Super-voting premium"  color="warning" />
          <MetricCard label="CLASS B VOTES"      value="10×"                                        sub="vs Class A per share"  color="indigo"  />
        </div>
      )}

      {/* Split bar chart — Economic vs Voting */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: 16 }}>
        <ChartTitle>Voting Power vs Economic Ownership — Top 9 Holders</ChartTitle>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 44 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: '#64748B', fontSize: 9, fontFamily: 'Space Mono' }}
              angle={-32}
              textAnchor="end"
              interval={0}
            />
            <YAxis tick={{ fill: '#64748B', fontSize: 10 }} tickFormatter={v => `${v}%`} />
            <Tooltip
              contentStyle={{ background: '#0B1117', border: '1px solid #1F2937', borderRadius: 4, fontSize: 12 }}
              labelStyle={{ color: '#94A3B8' }}
              formatter={(val: number, name: string) => [
                `${val.toFixed(1)}%`,
                name === 'economic' ? 'Economic Ownership' : 'Voting Power',
              ]}
              labelFormatter={(_: unknown, p: { payload?: { fullName?: string } }[]) =>
                p?.[0]?.payload?.fullName ?? ''
              }
            />
            <Bar dataKey="economic" fill="rgba(56,189,248,0.75)"  stroke="#38BDF8" strokeWidth={1} radius={[2,2,0,0]} name="economic" />
            <Bar dataKey="voting"   fill="rgba(129,140,248,0.75)" stroke="#818CF8" strokeWidth={1} radius={[2,2,0,0]} name="voting"   />
          </BarChart>
        </ResponsiveContainer>
        <ChartLegend items={[
          { color: '#38BDF8', label: 'Economic Ownership %' },
          { color: '#818CF8', label: 'Voting Power %' },
        ]} />
      </div>

      {/* Vote Premium chart — Fixed: proper domain so positive bars go UP, negative go DOWN */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: 16 }}>
        <ChartTitle>
          Vote Premium (Voting% − Economic%) — <span style={{ color: '#FBBF24' }}>Positive = Super-Voter</span>
          {' / '}
          <span style={{ color: '#F87171' }}>Negative = Diluted</span>
        </ChartTitle>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 44 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: '#64748B', fontSize: 9, fontFamily: 'Space Mono' }}
              angle={-32}
              textAnchor="end"
              interval={0}
            />
            {/* Fixed: symmetric domain so 0-line is visible and bars go correct direction */}
            <YAxis
              tick={{ fill: '#64748B', fontSize: 10 }}
              tickFormatter={v => `${v}%`}
              domain={['auto', 'auto']}
            />
            {/* Fixed: zero reference line so premium vs dilution is unambiguous */}
            <ReferenceLine y={0} stroke="#374151" strokeWidth={1} />
            <Tooltip
              contentStyle={{ background: '#0B1117', border: '1px solid #1F2937', borderRadius: 4, fontSize: 12 }}
              labelStyle={{ color: '#94A3B8' }}
              formatter={(v: number) => [`${v > 0 ? '+' : ''}${v.toFixed(1)}%`, 'Vote Premium']}
              labelFormatter={(_: unknown, p: { payload?: { fullName?: string } }[]) =>
                p?.[0]?.payload?.fullName ?? ''
              }
            />
            <Bar dataKey="premium" radius={[2,2,0,0]}>
              {chartData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.premium > 5 ? '#FBBF24' : entry.premium > 0 ? '#A3E635' : entry.premium < 0 ? '#F87171' : '#475569'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <ChartLegend items={[
          { color: '#FBBF24', label: 'Strong super-voter (>5%)' },
          { color: '#A3E635', label: 'Mild premium (0–5%)' },
          { color: '#F87171', label: 'Diluted (voting < economic)' },
          { color: '#475569', label: 'No premium' },
        ]} />
      </div>

      {/* Donut — Share class distribution */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: 16 }}>
        <ChartTitle>Share Class Distribution — {metrics?.ticker}</ChartTitle>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>

          {/* Fixed: use explicit width/height on PieChart, not responsive wrapper */}
          <div style={{ flexShrink: 0 }}>
            <PieChart width={180} height={180}>
              <Pie
                data={donutData}
                cx={90} cy={90}
                innerRadius={52} outerRadius={80}
                dataKey="value"
                paddingAngle={2}
              >
                {donutData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} stroke="#030712" strokeWidth={2} />
                ))}
              </Pie>
            </PieChart>
          </div>

          {/* Fixed: legend dots now always use correct per-entry color */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {shareClasses.map((sc, i) => (
              <div key={sc.class} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{
                  width: 11, height: 11, borderRadius: 2,
                  background: DONUT_COLORS[i % DONUT_COLORS.length],
                  flexShrink: 0, marginTop: 2,
                  // Fixed: add a visible border so dark colours (grey) are still distinguishable
                  border: '1px solid rgba(255,255,255,0.1)',
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}>
                    Class {sc.class}
                    {' — '}
                    {sc.votesPerShare === 0
                      ? <span style={{ color: '#F87171' }}>No Vote</span>
                      : `${sc.votesPerShare} vote${sc.votesPerShare > 1 ? 's' : ''}/share`}
                    {sc.synthetic && (
                      <span style={{
                        marginLeft: 7, fontSize: 9, padding: '1px 5px',
                        background: 'rgba(251,191,36,0.12)', color: '#FBBF24',
                        borderRadius: 2, fontFamily: 'Space Mono',
                        verticalAlign: 'middle',
                      }}>SYNTHETIC</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{sc.description}</div>
                </div>
                <span className="font-mono" style={{
                  fontSize: 13, fontWeight: 700,
                  color: DONUT_COLORS[i % DONUT_COLORS.length],
                  marginLeft: 'auto', flexShrink: 0,
                }}>
                  {sc.pct}%
                </span>
              </div>
            ))}
          </div>

        </div>

        {/* Data source note */}
        <div style={{
          marginTop: 14, paddingTop: 10,
          borderTop: '1px solid var(--border)',
          fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.7,
        }}>
          <span style={{ color: '#FBBF24', marginRight: 5 }}>⚠</span>
          Share class data: <strong style={{ color: 'var(--text-secondary)' }}>SEC DEF 14A</strong> (Class A economic),
          {' '}<strong style={{ color: '#FBBF24' }}>SYNTHETIC</strong> (Class B/C multipliers) per Real Rails Protocol where SEC disclosure is incomplete.
        </div>
      </div>

    </div>
  )
}
