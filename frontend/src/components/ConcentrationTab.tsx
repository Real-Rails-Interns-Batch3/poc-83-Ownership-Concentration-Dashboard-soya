'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts'
import type { Holder, EntityMetrics } from '@/types'

interface ConcentrationTabProps { holders: Holder[]; metrics: EntityMetrics | null }

const ALERT_COLOR: Record<string,string> = { CRITICAL:'#F87171', HIGH:'#FBBF24', MEDIUM:'#818CF8', LOW:'#34D399' }

export function ConcentrationTab({ holders, metrics }: ConcentrationTabProps) {
  const chartData = holders.map(h => ({
    name: h.name.length > 18 ? h.name.slice(0, 17) + '…' : h.name,
    fullName: h.name,
    economic: h.economicPct,
    voting: h.votingPct,
    type: h.type,
  }))

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14, animation:'fadeIn 0.3s ease' }}>

      {/* Alert bar */}
      {metrics && metrics.alertLevel !== 'LOW' && (
        <div style={{
          display:'flex', alignItems:'center', gap:10, padding:'10px 14px',
          background:`${ALERT_COLOR[metrics.alertLevel]}15`,
          border:`1px solid ${ALERT_COLOR[metrics.alertLevel]}55`,
          borderRadius:5, fontSize:12, color: ALERT_COLOR[metrics.alertLevel]
        }}>
          <span style={{ width:7, height:7, borderRadius:'50%', background:ALERT_COLOR[metrics.alertLevel], flexShrink:0, display:'inline-block', animation: metrics.alertLevel==='CRITICAL'?'pulse 1.2s infinite':'pulse 2s infinite' }} />
          <span>
            <strong>CONTROL ALERT ({metrics.alertLevel}):</strong> Top 3 shareholders hold {metrics.top3Combined}% combined. HHI index = {metrics.hhi.toLocaleString()} {metrics.hhi > 2500 ? `— exceeds SEC concentration threshold of 2,500.` : `— within normal range.`}
          </span>
        </div>
      )}

      {/* Metrics row */}
      {metrics && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:10 }}>
          <MetricCard label="TOP 1 HOLDER" value={`${metrics.top1EconomicPct}%`} sub={metrics.top1Holder} color="cyan" />
          <MetricCard label="HHI INDEX" value={metrics.hhi.toLocaleString()} sub={metrics.hhi>2500 ? `+${metrics.hhi-2500} vs threshold` : 'Below threshold'} color={metrics.hhi>2500?'danger':'success'} />
          <MetricCard label="INSIDER %" value={`${metrics.insiderEconomicPct}%`} sub="Founders + Mgmt" color="warning" />
          <MetricCard label="SHARE CLASSES" value={String(metrics.shareClasses)} sub="Distinct class types" color="indigo" />
        </div>
      )}

      {/* Bar chart */}
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:6, padding:16, flex:1 }}>
        <ChartTitle>
          Shareholder Concentration — Ownership % by Entity
          {metrics && <span style={{ color:'var(--cyan)', marginLeft:6 }}>({metrics.ticker})</span>}
        </ChartTitle>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top:4, right:8, left:0, bottom:40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
            <XAxis dataKey="name" tick={{ fill:'#64748B', fontSize:9, fontFamily:'Space Mono' }} angle={-30} textAnchor="end" interval={0} />
            <YAxis tick={{ fill:'#64748B', fontSize:10 }} tickFormatter={v => `${v}%`} domain={[0, 35]} />
            <Tooltip
              contentStyle={{ background:'#0B1117', border:'1px solid #1F2937', borderRadius:4, fontSize:12 }}
              labelStyle={{ color:'#94A3B8' }}
              formatter={(val: number, name: string) => [`${val.toFixed(1)}%`, name === 'economic' ? 'Economic Ownership' : 'Voting Power']}
              labelFormatter={(_: unknown, payload: {payload?: {fullName?: string}}[]) => payload?.[0]?.payload?.fullName ?? ''}
            />
            <Bar dataKey="economic" radius={[2,2,0,0]} name="economic">
              {chartData.map((entry, i) => (
                <Cell key={i} fill={i===0 ? '#38BDF8' : entry.type==='insider' ? '#FBBF24' : i < 3 ? '#818CF8' : '#1F2937'} stroke={i===0?'#38BDF8':entry.type==='insider'?'#FBBF24':i<3?'#818CF8':'#374151'} strokeWidth={1} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <ChartLegend items={[{ color:'#38BDF8', label:'Top Institutional' },{ color:'#818CF8', label:'Significant Holders' },{ color:'#FBBF24', label:'Insider / Founder' },{ color:'#1F2937', label:'Other' }]} />
      </div>

      {/* Holder table */}
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:6, padding:16 }}>
        <ChartTitle>Full Holder Registry — {metrics?.ticker}</ChartTitle>
        <HolderTable holders={holders} />
      </div>
    </div>
  )
}

function HolderTable({ holders }: { holders: Holder[] }) {
  return (
    <div style={{ overflowX:'auto' }}>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
        <thead>
          <tr style={{ borderBottom:'1px solid var(--border)' }}>
            {['Rank','Name','Type','Economic %','Voting %','Shares','QoQ Δ','Filed'].map(h => (
              <th key={h} style={{ padding:'6px 8px', color:'var(--text-muted)', fontFamily:'Space Mono', fontSize:9, letterSpacing:'0.06em', textAlign:'left', whiteSpace:'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {holders.map(h => (
            <tr key={h.rank} style={{ borderBottom:'1px solid #0f1923' }} onMouseEnter={e => e.currentTarget.style.background='#0f1923'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
              <td style={tdStyle} className="font-mono">{h.rank}</td>
              <td style={{ ...tdStyle, color:'var(--text-primary)', maxWidth:160, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{h.name}</td>
              <td style={tdStyle}>
                <span style={{ padding:'2px 6px', borderRadius:3, fontSize:9, background: h.type==='insider'?'rgba(251,191,36,0.12)':h.type==='institutional'?'rgba(56,189,248,0.1)':'rgba(71,85,105,0.2)', color: h.type==='insider'?'#FBBF24':h.type==='institutional'?'#38BDF8':'#64748B', fontFamily:'Space Mono' }}>
                  {h.type.toUpperCase()}
                </span>
              </td>
              <td style={{ ...tdStyle, color:'var(--cyan)', fontFamily:'Space Mono' }}>{h.economicPct.toFixed(1)}%</td>
              <td style={{ ...tdStyle, color:'var(--indigo)', fontFamily:'Space Mono' }}>{h.votingPct.toFixed(1)}%</td>
              <td style={{ ...tdStyle, color:'var(--text-muted)', fontFamily:'Space Mono' }}>{(h.shares/1e9).toFixed(1)}B</td>
              <td style={{ ...tdStyle, color: h.changeQoQ.startsWith('+') ? 'var(--success)' : h.changeQoQ.startsWith('-') ? 'var(--danger)' : 'var(--text-muted)', fontFamily:'Space Mono' }}>{h.changeQoQ}</td>
              <td style={{ ...tdStyle, color:'var(--text-muted)' }}>{h.filingDate}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const tdStyle: React.CSSProperties = { padding:'7px 8px', color:'var(--text-secondary)', verticalAlign:'middle' }

export function MetricCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: 'cyan'|'indigo'|'warning'|'danger'|'success' }) {
  const colorMap = { cyan:'var(--cyan)', indigo:'var(--indigo)', warning:'var(--warning)', danger:'var(--danger)', success:'var(--success)' }
  return (
    <div style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:5, padding:12 }}>
      <div className="font-mono" style={{ fontSize:9, color:'var(--text-muted)', letterSpacing:'0.06em', marginBottom:6 }}>{label}</div>
      <div className="font-mono" style={{ fontSize:22, fontWeight:700, color: colorMap[color], lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:4 }}>{sub}</div>
    </div>
  )
}

export function ChartTitle({ children }: { children: React.ReactNode }) {
  return <div className="font-mono" style={{ fontSize:10, letterSpacing:'0.08em', color:'var(--text-muted)', textTransform:'uppercase', marginBottom:14 }}>{children}</div>
}

export function ChartLegend({ items }: { items: { color: string; label: string }[] }) {
  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:14, marginTop:10 }}>
      {items.map(item => (
        <span key={item.label} style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'var(--text-muted)' }}>
          <span style={{ width:10, height:10, borderRadius:2, background:item.color, display:'inline-block' }} />
          {item.label}
        </span>
      ))}
    </div>
  )
}
