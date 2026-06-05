'use client'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts'
import type { Alert, HHIScore } from '@/types'
import { ChartTitle } from './ConcentrationTab'

interface AlertsTabProps {
  alerts: Alert[]
  hhiScores: HHIScore[]
}

const LEVEL_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }

// Fixed: deterministic colour by alertLevel, not by aboveThreshold + nested ternary
function hhiBarColor(alertLevel: string): string {
  if (alertLevel === 'CRITICAL') return '#F87171'
  if (alertLevel === 'HIGH')     return '#FBBF24'
  if (alertLevel === 'MEDIUM')   return '#818CF8'
  return '#34D399'
}

// Fixed: card border colour matches level (not hard-coded alpha)
function levelColor(level: string): string {
  if (level === 'CRITICAL') return '#F87171'
  if (level === 'HIGH')     return '#FBBF24'
  if (level === 'MEDIUM')   return '#818CF8'
  return '#34D399'
}

// Custom tooltip — Fixed: no floating label artefact on chart body
function HHITooltip({ active, payload, label }: { active?: boolean; payload?: {value: number}[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#0B1117', border: '1px solid #1F2937', borderRadius: 4, padding: '8px 12px', fontSize: 12 }}>
      <div style={{ color: '#94A3B8', fontFamily: 'Space Mono', fontSize: 10, marginBottom: 4 }}>{label}</div>
      <div style={{ color: '#F1F5F9' }}>
        HHI Score: <span style={{ fontFamily: 'Space Mono', fontWeight: 700 }}>{payload[0].value.toLocaleString()}</span>
      </div>
      <div style={{ color: '#64748B', fontSize: 10, marginTop: 3 }}>SEC threshold: 2,500</div>
    </div>
  )
}

export function AlertsTab({ alerts, hhiScores }: AlertsTabProps) {
  const sorted = [...alerts].sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level])

  const hhiChartData = hhiScores.map(h => ({
    ticker: h.ticker,
    hhi:    h.hhi,
    alertLevel: h.alertLevel,
    aboveThreshold: h.aboveThreshold,
    threshold: h.threshold,
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, animation: 'fadeIn 0.3s ease' }}>

      {/* HHI summary metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {hhiScores.map(h => {
          const col = levelColor(h.alertLevel)
          return (
            <div key={h.ticker} style={{
              background: 'var(--surface2)',
              border: `1px solid ${col}44`,
              borderTop: `2px solid ${col}`,
              borderRadius: 5, padding: 12,
            }}>
              <div className="font-mono" style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.06em', marginBottom: 6 }}>
                {h.ticker} · HHI
              </div>
              <div className="font-mono" style={{ fontSize: 22, fontWeight: 700, lineHeight: 1, color: col }}>
                {h.hhi.toLocaleString()}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 5 }}>
                {h.aboveThreshold
                  ? <span style={{ color: col }}>+{(h.hhi - h.threshold).toLocaleString()} above limit</span>
                  : <span style={{ color: '#34D399' }}>Below threshold</span>}
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'Space Mono' }}>
                {h.alertLevel}
              </div>
            </div>
          )
        })}
      </div>

      {/* HHI bar chart — Fixed: custom tooltip, correct colours, no floating label */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: 16 }}>
        <ChartTitle>HHI Concentration Score vs SEC Threshold (2,500) — All Entities</ChartTitle>
        <ResponsiveContainer width="100%" height={210}>
          <BarChart data={hhiChartData} margin={{ top: 8, right: 24, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
            <XAxis
              dataKey="ticker"
              tick={{ fill: '#64748B', fontSize: 11, fontFamily: 'Space Mono' }}
            />
            <YAxis
              tick={{ fill: '#64748B', fontSize: 10 }}
              domain={[0, 4200]}
              tickFormatter={v => v.toLocaleString()}
            />
            {/* Fixed: ReferenceLine label moved to insideTopRight to avoid overlap */}
            <ReferenceLine
              y={2500}
              stroke="#FBBF24"
              strokeDasharray="4 3"
              strokeWidth={1.5}
              label={{
                value: 'SEC Threshold: 2,500',
                position: 'insideTopRight',
                fill: '#FBBF24',
                fontSize: 9,
                fontFamily: 'Space Mono',
                dx: -4,
                dy: -6,
              }}
            />
            {/* Fixed: custom tooltip component — eliminates floating GOOG artefact */}
            <Tooltip content={<HHITooltip />} />
            <Bar dataKey="hhi" radius={[3, 3, 0, 0]}>
              {hhiChartData.map((entry, i) => (
                <Cell key={i} fill={hhiBarColor(entry.alertLevel)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
          {[
            { color: '#F87171', label: 'CRITICAL  (> 3,200)' },
            { color: '#FBBF24', label: 'HIGH       (> 2,800)' },
            { color: '#818CF8', label: 'MEDIUM  (> 2,500)' },
            { color: '#34D399', label: 'OK           (< 2,500)' },
          ].map(item => (
            <span key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: item.color, display: 'inline-block', flexShrink: 0 }} />
              {item.label}
            </span>
          ))}
        </div>
      </div>

      {/* Alert cards */}
      <div className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        Active Control Alerts — {sorted.length} flagged entities
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sorted.map(alert => (
          <AlertCard key={alert.ticker} alert={alert} />
        ))}
      </div>

      {/* Data note */}
      <div style={{
        padding: '10px 14px',
        background: 'rgba(71,85,105,0.12)',
        border: '1px solid var(--border)',
        borderRadius: 5,
        fontSize: 11,
        color: 'var(--text-muted)',
        lineHeight: 1.8,
      }}>
        <span className="font-mono" style={{ color: '#FBBF24', marginRight: 6 }}>⚠ DATA NOTE:</span>
        Voting power figures and share class multipliers are{' '}
        <strong style={{ color: 'var(--text-secondary)' }}>synthetic</strong> where SEC DEF 14A disclosure
        is incomplete, per Real Rails Protocol. Economic ownership data sourced from{' '}
        <strong style={{ color: 'var(--cyan)' }}>SEC EDGAR 13F filings</strong> via{' '}
        <strong style={{ color: 'var(--cyan)' }}>OpenCorporates</strong> entity matching.
        HHI scores computed from top-10 holder distributions. All figures reflect Q3 2024 filings.
      </div>

    </div>
  )
}

function AlertCard({ alert }: { alert: Alert }) {
  const col = levelColor(alert.level)
  const pulse = alert.level === 'CRITICAL' ? 'pulse 1.2s infinite' : alert.level === 'HIGH' ? 'pulse 2s infinite' : undefined

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 14,
      padding: '14px 16px',
      background: 'var(--surface)',
      border: `1px solid ${col}30`,
      borderLeft: `3px solid ${col}`,
      borderRadius: '0 5px 5px 0',
    }}>
      <div style={{ flexShrink: 0, paddingTop: 3 }}>
        <span style={{
          display: 'block', width: 8, height: 8, borderRadius: '50%',
          background: col,
          animation: pulse,
        }} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
          <span className="font-mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
            {alert.ticker}
          </span>
          <span className="font-mono" style={{
            fontSize: 9, padding: '2px 7px', borderRadius: 3,
            background: `${col}18`, color: col,
            border: `1px solid ${col}44`, letterSpacing: '0.08em',
          }}>
            {alert.level}
          </span>
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>
            {alert.title}
          </span>
        </div>

        <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 8 }}>
          {alert.message}
        </div>

        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic' }}>
          Source: {alert.source}
        </div>
      </div>
    </div>
  )
}
