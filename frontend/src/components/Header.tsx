'use client'
import type { OwnershipSummary } from '@/types'

interface HeaderProps { summary: OwnershipSummary | null }

export function Header({ summary }: HeaderProps) {
  return (
    <header style={{ background:'var(--surface)', borderBottom:'1px solid var(--border)', padding:'10px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <div style={{ width:30, height:30, border:'1.5px solid var(--cyan)', borderRadius:4, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-space-mono)', fontSize:11, color:'var(--cyan)', fontWeight:700, flexShrink:0 }}>RR</div>
        <div>
          <div className="font-mono" style={{ fontSize:11, letterSpacing:'0.1em', color:'var(--text-secondary)' }}>
            <span style={{ color:'var(--cyan)' }}>REAL RAILS</span> INTELLIGENCE LIBRARY
          </div>
          <div className="font-mono" style={{ fontSize:9, color:'var(--text-muted)', letterSpacing:'0.06em', marginTop:1 }}>
            CAPITAL FORMATION RAIL · POC-07 · OWNERSHIP CONCENTRATION DASHBOARD
          </div>
        </div>
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <Badge variant="live">MOCK DATA ACTIVE</Badge>
        <Badge>SEC EDGAR + OPENCORPORATES</Badge>
        <Badge>FastAPI v0.104</Badge>
        {summary && (
          <Badge>Updated {summary.lastUpdated}</Badge>
        )}
      </div>
    </header>
  )
}

function Badge({ children, variant }: { children: React.ReactNode; variant?: 'live' }) {
  return (
    <span className="font-mono" style={{
      fontSize:9, padding:'3px 8px',
      border:`1px solid ${variant==='live' ? 'var(--cyan)' : 'var(--border)'}`,
      borderRadius:3,
      color: variant==='live' ? 'var(--cyan)' : 'var(--text-muted)',
      letterSpacing:'0.08em',
      display:'flex', alignItems:'center', gap:5
    }}>
      {variant==='live' && <span style={{ width:5, height:5, borderRadius:'50%', background:'var(--cyan)', display:'inline-block', animation:'pulse 2s infinite' }} />}
      {children}
    </span>
  )
}
