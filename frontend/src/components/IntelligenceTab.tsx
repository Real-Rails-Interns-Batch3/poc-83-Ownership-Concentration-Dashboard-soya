'use client'
import { useState } from 'react'
import type { Ticker} from '@/types'
import { ChartTitle } from './ConcentrationTab'

// ─── Static intelligence data ─────────────────────────────────────────────────

const REPLAY_EVENTS: Record<Ticker, ReplayEvent[]> = {
  NVDA: [
    { id: 'e1', date: '2020-09-14', type: 'SPLIT',       title: '4-for-1 Stock Split',            detail: 'NVIDIA executed a 4-for-1 forward split. Vanguard and BlackRock stakes diluted proportionally; Jensen Huang insider % unchanged at ~3.5% pre-split equivalent.', impact: 'neutral' },
    { id: 'e2', date: '2021-04-12', type: 'FILING',      title: 'Vanguard Crosses 5% Threshold',  detail: 'Vanguard Group filed SC 13G/A disclosing beneficial ownership crossed 5%. Triggered enhanced SEC reporting obligations per Section 13(g).', impact: 'watch'   },
    { id: 'e3', date: '2022-02-08', type: 'ACQUISITION', title: 'Arm Holdings Deal Collapsed',    detail: '$40B Arm acquisition terminated after FTC/EU regulatory block. Insider lock-up period ended; Jensen Huang sold ~$50M in shares over 10-day window.', impact: 'high'    },
    { id: 'e4', date: '2023-06-09', type: 'SPLIT',       title: '10-for-1 Stock Split Announced', detail: 'NVIDIA announced 10-for-1 split effective Jun 10, 2024. BlackRock beneficial ownership report updated; no change in voting power ratios for insider Class B.', impact: 'neutral' },
    { id: 'e5', date: '2024-06-10', type: 'SPLIT',       title: '10-for-1 Split Effective',       detail: 'Split completed. Total shares outstanding: 24.4B. Vanguard filing updated to reflect adjusted share count. HHI recalculated — no material change.', impact: 'neutral' },
  ],
  GOOG: [
    { id: 'e1', date: '2014-04-02', type: 'CLASS',       title: 'Class C Shares Introduced',      detail: 'Alphabet created non-voting Class C shares (GOOG), allowing Page/Brin to issue equity for acquisitions without diluting voting control. Class B 10× multiplier preserved.', impact: 'high'    },
    { id: 'e2', date: '2019-12-03', type: 'GOVERNANCE',  title: 'Schmidt Exits Board',            detail: 'Eric Schmidt stepped down from Alphabet board. Voting bloc slightly reduced; Page/Brin combined Class B stake remained above 50% threshold.', impact: 'watch'   },
    { id: 'e3', date: '2021-02-03', type: 'BUYBACK',     title: '$50B Buyback Authorized',        detail: 'Board approved $50B share repurchase. Buybacks reduce float (Class A/C), incrementally increasing Page/Brin voting % even without Class B issuance.', impact: 'high'    },
    { id: 'e4', date: '2022-07-15', type: 'SPLIT',       title: '20-for-1 Stock Split',           detail: '20-for-1 split across Class A, B, and C shares. SEC filings updated. Voting ratios unchanged. Institutional threshold re-filings required for all >5% holders.', impact: 'neutral' },
  ],
  META: [
    { id: 'e1', date: '2012-05-18', type: 'IPO',         title: 'Facebook IPO — Dual-Class Listed',detail: "Meta listed with Class A (1 vote) and Class B (10 votes). Zuckerberg retained Class B majority. 'Founder control' structure established at day 0.", impact: 'high'    },
    { id: 'e2', date: '2016-06-20', type: 'CLASS',       title: 'Class C Proposal Defeated',      detail: 'Shareholders blocked Zuckerberg\'s proposal to create non-voting Class C shares. Existing dual-class structure retained. Largest minority shareholder revolt to date.', impact: 'high'    },
    { id: 'e3', date: '2022-10-12', type: 'BUYBACK',     title: 'Zuckerberg Voting Power Peaks',  detail: "With Class A float reduced via buybacks and Class B unchanged, Zuckerberg's effective voting % increased to ~57.9% — highest post-IPO level.", impact: 'high'    },
    { id: 'e4', date: '2023-03-01', type: 'GOVERNANCE',  title: 'No Sunset Clause — ISS Flags',   detail: 'ISS and Glass Lewis flagged absence of any sunset clause on Class B shares. Institutional investor pushback noted in proxy season. No structural change made.', impact: 'watch'   },
  ],
  AMZN: [
    { id: 'e1', date: '2021-02-02', type: 'GOVERNANCE',  title: 'Bezos Steps Down as CEO',        detail: 'Jeff Bezos transitioned to Executive Chairman. Andy Jassy became CEO. Bezos began gradual divestiture program; stake declined from ~11% to ~9.4%.', impact: 'watch'   },
    { id: 'e2', date: '2022-06-06', type: 'SPLIT',       title: '20-for-1 Stock Split',           detail: 'Amazon executed 20-for-1 split. All shares are single-class (1 vote each); no voting structure impact. Institutional filings updated. HHI unchanged materially.', impact: 'neutral' },
    { id: 'e3', date: '2023-11-14', type: 'FILING',      title: 'Bezos Sells $2.0B in Shares',    detail: 'Form 4 filing: Bezos sold ~12.2M shares over 4 days. Stake dropped below 10% threshold. No longer required to file as a >10% beneficial owner under Section 16.', impact: 'watch'   },
  ],
}

const EMITTED_FIELDS: EmittedField[] = [
  { field: 'ticker',            source: 'SEC EDGAR 13F',        pii: false, synthetic: false, description: 'Exchange ticker symbol for the reporting entity' },
  { field: 'economicPct',       source: 'SEC EDGAR 13F',        pii: false, synthetic: false, description: 'Percentage of outstanding shares held (economic ownership)' },
  { field: 'votingPct',         source: 'SEC DEF 14A / Synthetic', pii: false, synthetic: true,  description: 'Estimated voting power — synthetic where SEC disclosure incomplete' },
  { field: 'shareClass',        source: 'SEC S-1 / DEF 14A',    pii: false, synthetic: true,  description: 'Share class identifier (A/B/C); vote multiplier synthetic per Rail Protocol' },
  { field: 'holderName',        source: 'SEC EDGAR 13F',        pii: false, synthetic: false, description: 'Registered name of the institutional holder or insider' },
  { field: 'holderType',        source: 'OpenCorporates',       pii: false, synthetic: false, description: 'Entity classification: institutional, insider, or retail' },
  { field: 'shares',            source: 'SEC EDGAR 13F',        pii: false, synthetic: false, description: 'Absolute share count held at last filing date' },
  { field: 'filingDate',        source: 'SEC EDGAR',            pii: false, synthetic: false, description: 'Date of most recent 13F or Form 4 filing' },
  { field: 'changeQoQ',         source: 'SEC EDGAR (computed)', pii: false, synthetic: false, description: 'Quarter-on-quarter change in stake computed from sequential 13F filings' },
  { field: 'hhi',               source: 'Computed (13F data)',  pii: false, synthetic: false, description: 'Herfindahl–Hirschman Index — concentration score from top-10 holder distribution' },
  { field: 'voteEquityRatio',   source: 'Computed (synthetic)', pii: false, synthetic: true,  description: 'Ratio of voting power to economic ownership — synthetic where Class B data absent' },
  { field: 'insiderVotingPct',  source: 'Synthetic',            pii: false, synthetic: true,  description: 'Aggregated insider voting power — fully synthetic; derived from disclosed Class B structures' },
]

const PARTNER_CHAIN: PartnerLink[] = [
  { name: 'SEC EDGAR',        role: 'Primary economic data',       type: 'regulator', url: 'https://www.sec.gov/cgi-bin/browse-edgar', fields: ['economicPct','shares','holderName','filingDate','changeQoQ'], latency: 'T+45 days (13F quarterly)', reliability: 'High' },
  { name: 'OpenCorporates',   role: 'Entity classification',       type: 'data',      url: 'https://opencorporates.com',               fields: ['holderType','holderName (canonical)'], latency: 'Near real-time', reliability: 'Medium' },
  { name: 'SEC DEF 14A',      role: 'Proxy / voting structure',    type: 'regulator', url: 'https://www.sec.gov/cgi-bin/browse-edgar', fields: ['shareClass','voteMultiplier'], latency: 'Annual (proxy season)', reliability: 'High' },
  { name: 'Rail Compute Layer', role: 'Synthetic field generation', type: 'internal', url: '#',                                        fields: ['votingPct','voteEquityRatio','insiderVotingPct','hhi'], latency: 'On-demand', reliability: 'Derived' },
  { name: 'SEC Form 4',       role: 'Insider transaction data',    type: 'regulator', url: 'https://www.sec.gov/cgi-bin/browse-edgar', fields: ['changeQoQ (insider)','filingDate'], latency: 'T+2 business days', reliability: 'High' },
]

const PRIVACY_IMPLICATIONS: PrivacyItem[] = [
  { category: 'Individual Insiders', risk: 'HIGH', detail: 'Form 4 and DEF 14A filings expose precise share counts, transaction dates, and holding values for named individuals (e.g. Jensen Huang, Mark Zuckerberg). Combined with salary disclosures, this creates a full wealth profile for named officers.', regulation: 'SEC §16 / Reg S-K', piiInvolved: true },
  { category: 'Institutional Holdings', risk: 'LOW', detail: '13F filings are public record for institutions >$100M AUM. No individual-level PII. Entity-level holdings only. Re-identification risk is negligible for large institutional names.', regulation: 'SEC §13F', piiInvolved: false },
  { category: 'Synthetic Voting Data', risk: 'MEDIUM', detail: 'Synthetic vote multipliers are derived from public structural disclosures. Risk: synthetic data attributed to a named individual (e.g. computed insider voting %) could be presented as fact, creating reputational or legal exposure if incorrect.', regulation: 'GDPR Art. 5(1)(d) — accuracy', piiInvolved: true },
  { category: 'Cross-Entity Profiling', risk: 'MEDIUM', detail: 'Combining holder names across multiple entities (e.g. Vanguard appearing in NVDA, GOOG, META, AMZN) enables cross-entity profiling of investment strategies. At institutional level, not PII — but sensitive under MiFID II best-execution rules.', regulation: 'MiFID II / GDPR Art. 4(4)', piiInvolved: false },
  { category: 'OpenCorporates Entity Match', risk: 'LOW', detail: 'OpenCorporates matching may return subsidiary/parent company names. Misclassification risk: a natural person operating through a holding entity could be mis-typed as institutional, suppressing appropriate individual-level protections.', regulation: 'GDPR Art. 4(1) — natural person definition', piiInvolved: true },
]

const MITIGATION_TIPS: MitigationTip[] = [
  { id: 'm1', priority: 'P0', title: 'Label all synthetic fields at point of use', detail: 'Every field where synthetic=true must be annotated in UI, API responses, and exports. Never present computed voting % as a confirmed SEC figure. Use "est." or "SYNTHETIC" tag consistently.', category: 'Data Integrity' },
  { id: 'm2', priority: 'P0', title: 'Do not cache insider PII beyond filing cadence', detail: 'Form 4 data (individual insider trades) should not be cached beyond the SEC\'s T+2 publication window. Stale insider data combined with live market data creates insider-information risk.', category: 'Privacy' },
  { id: 'm3', priority: 'P1', title: 'HHI threshold alerts require human review before action', detail: 'Automated alerts triggered by HHI > 2,500 should never directly trigger regulatory filings or fund actions. Always include a human-in-the-loop review step; HHI is a computed heuristic, not an SEC violation indicator.', category: 'Governance' },
  { id: 'm4', priority: 'P1', title: 'Isolate individual insider records from institutional exports', detail: 'Bulk data exports must separate institutional 13F data (non-PII) from individual insider Form 4 data (PII). Do not ship combined exports without a data-sharing agreement that covers natural persons.', category: 'Privacy' },
  { id: 'm5', priority: 'P1', title: 'Version-pin synthetic vote multipliers', detail: 'When a company amends its charter (e.g. Meta removing Class C proposal), the synthetic multipliers must be re-derived and old versions archived, not overwritten. Version history prevents retroactive data errors.', category: 'Data Integrity' },
  { id: 'm6', priority: 'P2', title: 'Apply GDPR accuracy principle to cross-entity profiles', detail: 'When an institution appears across multiple tickers, their combined profile must reflect the most recent 13F data per entity. Do not aggregate stale filings from different quarters into a single cross-entity view.', category: 'Compliance' },
  { id: 'm7', priority: 'P2', title: 'Audit log all SEC EDGAR API calls', detail: 'Maintain a complete audit log of EDGAR data pulls (timestamp, endpoint, ticker, filing type). Required for demonstrating data provenance in regulatory review. Retention: minimum 7 years per SOX 802.', category: 'Compliance' },
]

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReplayEvent {
  id: string; date: string; type: string; title: string; detail: string; impact: 'high' | 'watch' | 'neutral'
}
interface EmittedField {
  field: string; source: string; pii: boolean; synthetic: boolean; description: string
}
interface PartnerLink {
  name: string; role: string; type: 'regulator' | 'data' | 'internal'; url: string; fields: string[]; latency: string; reliability: string
}
interface PrivacyItem {
  category: string; risk: 'HIGH' | 'MEDIUM' | 'LOW'; detail: string; regulation: string; piiInvolved: boolean
}
interface MitigationTip {
  id: string; priority: 'P0' | 'P1' | 'P2'; title: string; detail: string; category: string
}

// ─── Sub-section ids ─────────────────────────────────────────────────────────
type Section = 'replay' | 'fields' | 'chain' | 'privacy' | 'mitigations'

const SECTIONS: { id: Section; label: string }[] = [
  { id: 'replay',      label: 'Event Replay'    },
  { id: 'fields',      label: 'Emitted Fields'  },
  { id: 'chain',       label: 'Partner Chain'   },
  { id: 'privacy',     label: 'Privacy'         },
  { id: 'mitigations', label: 'Mitigations'     },
]

const IMPACT_COLOR = { high: '#F87171', watch: '#FBBF24', neutral: '#64748B' }
const RISK_COLOR   = { HIGH: '#F87171', MEDIUM: '#FBBF24', LOW: '#34D399' }
const PRIO_COLOR   = { P0: '#F87171', P1: '#FBBF24', P2: '#818CF8' }
const TYPE_COLOR   = { regulator: '#38BDF8', data: '#818CF8', internal: '#34D399' }
const EVENT_COLORS = { SPLIT:'#38BDF8', FILING:'#818CF8', ACQUISITION:'#F87171', CLASS:'#FBBF24', GOVERNANCE:'#94A3B8', BUYBACK:'#34D399', IPO:'#A3E635' }

// ─── Component ───────────────────────────────────────────────────────────────

interface IntelligenceTabProps { ticker: Ticker;  }

export function IntelligenceTab({ ticker }: IntelligenceTabProps) {
  const [section, setSection]         = useState<Section>('replay')
  const [replayTicker, setReplayTicker] = useState<Ticker>(ticker)
  const [selectedEvent, setSelectedEvent] = useState<ReplayEvent | null>(null)
  const [expandedField, setExpandedField] = useState<string | null>(null)

  const events = REPLAY_EVENTS[replayTicker] ?? []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, animation: 'fadeIn 0.3s ease' }}>

      {/* Sub-nav */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 14, flexWrap: 'wrap' }}>
        {SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            style={{
              padding: '6px 14px', fontSize: 10, fontFamily: 'var(--font-space-mono)',
              letterSpacing: '0.07em', borderRadius: 3, cursor: 'pointer',
              background: section === s.id ? 'rgba(56,189,248,0.15)' : 'var(--surface)',
              border: `1px solid ${section === s.id ? 'var(--cyan)' : 'var(--border)'}`,
              color: section === s.id ? 'var(--cyan)' : 'var(--text-muted)',
              transition: 'all 0.15s',
            }}
          >
            {s.label.toUpperCase()}
          </button>
        ))}
      </div>

      {/* ── 1. SINGLE-EVENT REPLAY ── */}
      {section === 'replay' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <ChartTitle>Single-Event Replay — Ownership Structure Change Log</ChartTitle>
            <select
              value={replayTicker}
              onChange={e => { setReplayTicker(e.target.value as Ticker); setSelectedEvent(null) }}
              style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text-primary)', fontSize: 11, padding: '5px 10px', fontFamily: 'var(--font-space-mono)', cursor: 'pointer' }}
            >
              {(['NVDA','GOOG','META','AMZN'] as Ticker[]).map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Timeline */}
          <div style={{ position: 'relative', paddingLeft: 28 }}>
            {/* Vertical line */}
            <div style={{ position: 'absolute', left: 10, top: 8, bottom: 8, width: 1, background: 'var(--border)' }} />

            {events.map(ev => {
              const isSelected = selectedEvent?.id === ev.id
              const evColor = (EVENT_COLORS as Record<string,string>)[ev.type] ?? '#64748B'
              const impColor = IMPACT_COLOR[ev.impact]
              return (
                <div
                  key={ev.id}
                  onClick={() => setSelectedEvent(isSelected ? null : ev)}
                  style={{
                    position: 'relative', marginBottom: 10, cursor: 'pointer',
                    background: isSelected ? 'var(--surface)' : 'var(--surface2)',
                    border: `1px solid ${isSelected ? 'var(--cyan)' : 'var(--border)'}`,
                    borderRadius: 5, padding: '10px 14px',
                    transition: 'border-color 0.15s',
                  }}
                >
                  {/* Timeline dot */}
                  <span style={{
                    position: 'absolute', left: -22, top: 14,
                    width: 8, height: 8, borderRadius: '50%',
                    background: impColor, border: '1.5px solid var(--bg)',
                    display: 'block',
                    boxShadow: ev.impact === 'high' ? `0 0 6px ${impColor}` : 'none',
                  }} />

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: isSelected ? 8 : 0, flexWrap: 'wrap' }}>
                    <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>{ev.date}</span>
                    <span style={{
                      fontSize: 9, padding: '1px 6px', borderRadius: 2,
                      background: `${evColor}18`, color: evColor,
                      border: `1px solid ${evColor}44`, fontFamily: 'Space Mono', letterSpacing: '0.06em',
                    }}>{ev.type}</span>
                    <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', flex: 1 }}>{ev.title}</span>
                    <span style={{
                      fontSize: 9, padding: '1px 6px', borderRadius: 2,
                      background: `${impColor}18`, color: impColor,
                      fontFamily: 'Space Mono', letterSpacing: '0.06em',
                    }}>{ev.impact.toUpperCase()}</span>
                  </div>

                  {isSelected && (
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7, marginTop: 4, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                      {ev.detail}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 4 }}>
            Click any event to expand the full replay detail. Sources: SEC EDGAR, OpenCorporates, proxy filings.
          </div>
        </div>
      )}

      {/* ── 2. EMITTED FIELDS LIST ── */}
      {section === 'fields' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <ChartTitle>Emitted Fields — Data Dictionary & Provenance</ChartTitle>

          <div style={{ display: 'flex', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            {[
              { label: `${EMITTED_FIELDS.filter(f=>!f.synthetic).length} from SEC/OC`, color: '#38BDF8' },
              { label: `${EMITTED_FIELDS.filter(f=>f.synthetic).length} synthetic`, color: '#FBBF24' },
              { label: `${EMITTED_FIELDS.filter(f=>f.pii).length} PII-adjacent`, color: '#F87171' },
            ].map(b => (
              <span key={b.label} style={{ fontSize: 10, padding: '3px 10px', borderRadius: 3, background: `${b.color}15`, border: `1px solid ${b.color}40`, color: b.color, fontFamily: 'Space Mono' }}>
                {b.label}
              </span>
            ))}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Field', 'Source', 'Synthetic', 'PII Risk', 'Description'].map(h => (
                    <th key={h} style={{ padding: '7px 10px', color: 'var(--text-muted)', fontFamily: 'Space Mono', fontSize: 9, letterSpacing: '0.06em', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {EMITTED_FIELDS.map(f => (
                  <tr
                    key={f.field}
                    onClick={() => setExpandedField(expandedField === f.field ? null : f.field)}
                    style={{ borderBottom: '1px solid #0f1923', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#0f1923'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '7px 10px' }}>
                      <span className="font-mono" style={{ fontSize: 11, color: 'var(--cyan)' }}>{f.field}</span>
                    </td>
                    <td style={{ padding: '7px 10px', color: 'var(--text-secondary)', fontSize: 11 }}>{f.source}</td>
                    <td style={{ padding: '7px 10px' }}>
                      {f.synthetic
                        ? <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 2, background: 'rgba(251,191,36,0.12)', color: '#FBBF24', fontFamily: 'Space Mono' }}>SYNTHETIC</span>
                        : <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 2, background: 'rgba(52,211,153,0.1)', color: '#34D399', fontFamily: 'Space Mono' }}>REAL</span>}
                    </td>
                    <td style={{ padding: '7px 10px' }}>
                      {f.pii
                        ? <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 2, background: 'rgba(248,113,113,0.1)', color: '#F87171', fontFamily: 'Space Mono' }}>PII</span>
                        : <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>—</span>}
                    </td>
                    <td style={{ padding: '7px 10px', color: 'var(--text-muted)', maxWidth: 300 }}>
                      {expandedField === f.field
                        ? <span style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{f.description}</span>
                        : <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', maxWidth: 280 }}>{f.description}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic' }}>
            Click any row to expand description. Synthetic fields are always labeled at point of use per Real Rails Protocol.
          </div>
        </div>
      )}

      {/* ── 3. PARTNER CHAIN ── */}
      {section === 'chain' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <ChartTitle>Partner Chain — Data Provenance & Source Architecture</ChartTitle>

          {/* Flow diagram */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto', paddingBottom: 8 }}>
            {PARTNER_CHAIN.map((p, i) => (
              <div key={p.name} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                <div style={{
                  background: 'var(--surface2)',
                  border: `1px solid ${TYPE_COLOR[p.type]}44`,
                  borderTop: `2px solid ${TYPE_COLOR[p.type]}`,
                  borderRadius: 5, padding: '10px 14px',
                  minWidth: 140, maxWidth: 160,
                }}>
                  <div style={{ fontSize: 9, fontFamily: 'Space Mono', color: TYPE_COLOR[p.type], letterSpacing: '0.08em', marginBottom: 4 }}>
                    {p.type.toUpperCase()}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>{p.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 6 }}>{p.role}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'Space Mono' }}>
                    Latency: <span style={{ color: 'var(--text-secondary)' }}>{p.latency}</span>
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'Space Mono', marginTop: 2 }}>
                    Reliability: <span style={{ color: p.reliability === 'High' ? '#34D399' : p.reliability === 'Medium' ? '#FBBF24' : '#818CF8' }}>{p.reliability}</span>
                  </div>
                </div>
                {i < PARTNER_CHAIN.length - 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', padding: '0 6px', color: 'var(--text-muted)', fontSize: 14 }}>→</div>
                )}
              </div>
            ))}
          </div>

          {/* Detailed breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
            {PARTNER_CHAIN.map(p => (
              <div key={p.name} style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderLeft: `3px solid ${TYPE_COLOR[p.type]}`, borderRadius: '0 5px 5px 0', padding: '12px 16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</span>
                  <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 2, background: `${TYPE_COLOR[p.type]}18`, color: TYPE_COLOR[p.type], fontFamily: 'Space Mono' }}>{p.type.toUpperCase()}</span>
                  {p.url !== '#' && (
                    <a href={p.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: 'var(--cyan)', textDecoration: 'none', fontFamily: 'Space Mono' }}>
                      ↗ {p.url.replace('https://','').split('/')[0]}
                    </a>
                  )}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', marginRight: 4 }}>Fields emitted:</span>
                  {p.fields.map(f => (
                    <span key={f} style={{ fontSize: 9, padding: '1px 7px', borderRadius: 2, background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--cyan)', fontFamily: 'Space Mono' }}>{f}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 4. PRIVACY IMPLICATIONS ── */}
      {section === 'privacy' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <ChartTitle>Privacy Implications — PII Risk & Regulatory Exposure</ChartTitle>

          <div style={{ display: 'flex', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            {['HIGH','MEDIUM','LOW'].map(r => {
              const count = PRIVACY_IMPLICATIONS.filter(p => p.risk === r).length
              const col = RISK_COLOR[r as keyof typeof RISK_COLOR]
              return (
                <span key={r} style={{ fontSize: 10, padding: '3px 10px', borderRadius: 3, background: `${col}15`, border: `1px solid ${col}40`, color: col, fontFamily: 'Space Mono' }}>
                  {count} {r} risk
                </span>
              )
            })}
          </div>

          {PRIVACY_IMPLICATIONS.map(item => {
            const col = RISK_COLOR[item.risk]
            return (
              <div key={item.category} style={{
                background: 'var(--surface)',
                border: `1px solid ${col}30`,
                borderLeft: `3px solid ${col}`,
                borderRadius: '0 5px 5px 0', padding: '12px 16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{item.category}</span>
                  <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 3, background: `${col}18`, color: col, border: `1px solid ${col}44`, fontFamily: 'Space Mono' }}>{item.risk}</span>
                  {item.piiInvolved && (
                    <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 3, background: 'rgba(248,113,113,0.1)', color: '#F87171', border: '1px solid rgba(248,113,113,0.3)', fontFamily: 'Space Mono' }}>PII INVOLVED</span>
                  )}
                  <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 3, background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text-muted)', fontFamily: 'Space Mono', marginLeft: 'auto' }}>{item.regulation}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{item.detail}</div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── 5. MITIGATION TIPS ── */}
      {section === 'mitigations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <ChartTitle>Mitigation Tips — Guardrails & Remediation Actions</ChartTitle>

          <div style={{ display: 'flex', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            {(['P0','P1','P2'] as const).map(p => {
              const count = MITIGATION_TIPS.filter(m => m.priority === p).length
              const col = PRIO_COLOR[p]
              return (
                <span key={p} style={{ fontSize: 10, padding: '3px 10px', borderRadius: 3, background: `${col}15`, border: `1px solid ${col}40`, color: col, fontFamily: 'Space Mono' }}>
                  {count}× {p} — {p === 'P0' ? 'Critical' : p === 'P1' ? 'High' : 'Medium'}
                </span>
              )
            })}
          </div>

          {MITIGATION_TIPS.map(tip => {
            const col = PRIO_COLOR[tip.priority]
            return (
              <div key={tip.id} style={{
                background: 'var(--surface)',
                border: `1px solid ${col}30`,
                borderLeft: `3px solid ${col}`,
                borderRadius: '0 5px 5px 0', padding: '12px 16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                  <span className="font-mono" style={{ fontSize: 11, fontWeight: 700, color: col }}>{tip.priority}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{tip.title}</span>
                  <span style={{ fontSize: 9, padding: '1px 7px', borderRadius: 2, background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text-muted)', fontFamily: 'Space Mono', marginLeft: 'auto' }}>
                    {tip.category}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{tip.detail}</div>
              </div>
            )
          })}

          <div style={{ padding: '10px 14px', background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 5, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.7, marginTop: 4 }}>
            <span className="font-mono" style={{ color: 'var(--cyan)', marginRight: 6 }}>ℹ PROTOCOL NOTE:</span>
            P0 mitigations are blocking — they must be resolved before any downstream consumer receives data. P1 must be resolved before any live (non-mock) SEC API integration. P2 are best-effort for the POC phase.
          </div>
        </div>
      )}

    </div>
  )
}
