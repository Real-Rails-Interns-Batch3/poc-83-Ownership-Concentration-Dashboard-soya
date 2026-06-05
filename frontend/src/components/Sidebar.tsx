'use client'
import { Download } from 'lucide-react'
import type { OwnershipSummary, Ticker, HolderTypeFilter } from '@/types'
import { downloadExportJSON } from '@/lib/api'

interface SidebarProps {
  summary: OwnershipSummary | null
  ticker: Ticker
  holderType: HolderTypeFilter
  onTickerChange: (t: Ticker) => void
  onHolderTypeChange: (t: HolderTypeFilter) => void
}

const TICKERS: { value: Ticker; label: string }[] = [
  { value:'NVDA', label:'NVDA — NVIDIA Corp' },
  { value:'GOOG', label:'GOOG — Alphabet Inc' },
  { value:'META', label:'META — Meta Platforms' },
  { value:'AMZN', label:'AMZN — Amazon.com Inc' },
]

const ALERT_COLORS: Record<string,string> = {
  cyan: 'var(--cyan)', warning: 'var(--warning)', muted: 'var(--text-secondary)', dim: 'var(--text-muted)'
}

export function Sidebar({ summary, ticker, holderType, onTickerChange, onHolderTypeChange }: SidebarProps) {
  const s = summary

  return (
    <aside style={{ width:'30%', borderLeft:'1px solid var(--border)', display:'flex', flexDirection:'column', overflowY:'auto', flexShrink:0 }}>

      {/* Section A */}
      <section style={sectionStyle}>
        <SectionLabel letter="A">Rail Thesis</SectionLabel>
        <div style={{ fontSize:15, fontWeight:600, color:'var(--text-primary)', marginBottom:4 }}>
          Ownership Concentration Dashboard
        </div>
        <div style={{ fontSize:11, color:'var(--text-secondary)', marginBottom:12 }}>Capital Formation Rail · Real Rails Intelligence Library</div>
        <InsightBlock color="cyan">
          <div className="font-mono" style={{ fontSize:22, fontWeight:700, color:'var(--cyan)', marginBottom:4 }}>
            {s?.sidebarA.stat ?? '67.4%'}
          </div>
          <div style={{ fontSize:12, color:'var(--text-secondary)', lineHeight:1.6 }}>
            {s?.sidebarA.thesis ?? 'Control sits in the rails. Decision-making power is concentrated in founders, institutional holders, and share classes — not distributed across the market.'}
          </div>
        </InsightBlock>
      </section>

      {/* Section B */}
      <section style={sectionStyle}>
        <SectionLabel letter="B">Why This Matters</SectionLabel>
        <InsightBlock color="cyan">
          <div style={{ fontSize:12, fontWeight:500, color:'var(--text-primary)', marginBottom:4 }}>Control sits in the rails.</div>
          <div style={{ fontSize:12, color:'var(--text-secondary)', lineHeight:1.6 }}>
            {s?.sidebarB.body ?? 'Majority shareholders with super-voting shares can override minority investors, direct M&A, and set capital allocation with no quorum risk.'}
          </div>
        </InsightBlock>
        <InsightBlock color="indigo">
          <div className="font-mono" style={{ fontSize:18, fontWeight:700, color:'var(--indigo)', marginBottom:2 }}>
            {s?.sidebarB.keyStat ?? '1.42×'}
          </div>
          <div style={{ fontSize:12, color:'var(--text-secondary)', lineHeight:1.6 }}>
            {s?.sidebarB.keyStatLabel ?? 'Average vote-to-equity premium. Class B holders control boardrooms while Class A holders bear economic risk.'}
          </div>
        </InsightBlock>
      </section>

      {/* Section C */}
      <section style={sectionStyle}>
        <SectionLabel letter="C">Who Controls the Rail</SectionLabel>
        <div style={{ fontSize:12, color:'var(--text-secondary)', lineHeight:1.6, marginBottom:10 }}>
          {s?.sidebarC.body ?? 'Decision-making power is distributed across founders, institutional asset managers, and differentiated share classes.'}
        </div>
        <InsightBlock color="warning">
          <div className="font-mono" style={{ fontSize:16, fontWeight:700, color:'var(--warning)', marginBottom:2 }}>3 share classes</div>
          <div style={{ fontSize:12, color:'var(--text-secondary)', lineHeight:1.6 }}>
            Class A (public, 1 vote), Class B (founder/insider, 10 votes), Class C (no vote). Synthetic data used where SEC disclosure is incomplete per Rail Protocol.
          </div>
        </InsightBlock>
        <div style={{ display:'flex', flexDirection:'column', gap:0, marginTop:8 }}>
          {(s?.sidebarC.breakdown ?? [
            { label:'Institutional', pct:52.1, color:'cyan' },
            { label:'Insiders / Founders', pct:19.2, color:'warning' },
            { label:'Retail / Public Float', pct:22.4, color:'muted' },
            { label:'Other / Unknown', pct:6.3, color:'dim' },
          ]).map((item, i, arr) => (
            <div key={item.label} style={{
              display:'flex', justifyContent:'space-between', alignItems:'center',
              fontSize:11, padding:'5px 0',
              borderBottom: i < arr.length-1 ? '1px solid var(--border)' : 'none'
            }}>
              <span style={{ color:'var(--text-muted)' }}>{item.label}</span>
              <span className="font-mono" style={{ color: ALERT_COLORS[item.color] ?? 'var(--text-secondary)' }}>
                {item.pct.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Section D */}
      <section style={sectionStyle}>
        <SectionLabel letter="D">Filters</SectionLabel>
        <FilterGroup label="ENTITY / TICKER">
          <select
            value={ticker}
            onChange={e => onTickerChange(e.target.value as Ticker)}
            style={selectStyle}
          >
            {TICKERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </FilterGroup>
        <FilterGroup label="HOLDER TYPE">
          <select
            value={holderType}
            onChange={e => onHolderTypeChange(e.target.value as HolderTypeFilter)}
            style={selectStyle}
          >
            <option value="all">All Holder Types</option>
            <option value="institutional">Institutional Only</option>
            <option value="insider">Insiders / Founders</option>
          </select>
        </FilterGroup>
        <div style={{ fontSize:10, fontFamily:'var(--font-space-mono)', color:'var(--text-muted)', marginTop:8, lineHeight:1.6 }}>
          Filters update charts without page refresh. Voting rights data is synthetic per Real Rails Protocol where SEC disclosure is incomplete.
        </div>
      </section>

      {/* Section E */}
      <section style={sectionStyle}>
        <SectionLabel letter="E">Export</SectionLabel>
        <button
          onClick={downloadExportJSON}
          style={{
            width:'100%', padding:'10px', background:'transparent',
            border:'1px solid var(--cyan)', borderRadius:4,
            color:'var(--cyan)', fontSize:11,
            fontFamily:'var(--font-space-mono)', letterSpacing:'0.06em',
            cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            transition:'background 0.15s'
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--cyan-dim)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <Download size={13} />
          DOWNLOAD SAMPLE DATA (JSON)
        </button>
        <div className="font-mono" style={{ fontSize:9, color:'var(--text-muted)', marginTop:8, lineHeight:1.8 }}>
          ownership_snapshot.json<br />
          voting_rights.json<br />
          hhi_scores.json · alerts.json
        </div>
      </section>

    </aside>
  )
}

function SectionLabel({ letter, children }: { letter: string; children: React.ReactNode }) {
  return (
    <div className="font-mono" style={{ fontSize:9, letterSpacing:'0.12em', color:'var(--text-muted)', textTransform:'uppercase', marginBottom:10 }}>
      Section {letter} · {children}
    </div>
  )
}

function InsightBlock({ children, color }: { children: React.ReactNode; color: 'cyan'|'indigo'|'warning' }) {
  const borderColor = color==='cyan' ? 'var(--cyan)' : color==='indigo' ? 'var(--indigo)' : 'var(--warning)'
  return (
    <div style={{ background:'var(--surface2)', borderLeft:`2px solid ${borderColor}`, borderRadius:'0 4px 4px 0', padding:'10px 12px', marginBottom:10 }}>
      {children}
    </div>
  )
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom:10 }}>
      <div className="font-mono" style={{ fontSize:9, color:'var(--text-muted)', letterSpacing:'0.06em', marginBottom:5 }}>{label}</div>
      {children}
    </div>
  )
}

const sectionStyle: React.CSSProperties = { padding:16, borderBottom:'1px solid var(--border)' }

const selectStyle: React.CSSProperties = {
  width:'100%', background:'var(--surface2)', border:'1px solid var(--border)',
  borderRadius:4, color:'var(--text-primary)', fontSize:12, padding:'7px 10px',
  fontFamily:'var(--font-dm-sans)', cursor:'pointer', outline:'none'
}
