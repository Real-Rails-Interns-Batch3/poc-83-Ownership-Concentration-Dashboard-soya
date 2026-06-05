'use client'
import { useState, useEffect, useCallback } from 'react'
import { Header } from '@/components/Header'
import { Sidebar } from '@/components/Sidebar'
import { ConcentrationTab } from '@/components/ConcentrationTab'
import { VotingTab } from '@/components/VotingTab'
import { CompareTab } from '@/components/CompareTab'
import { AlertsTab } from '@/components/AlertsTab'
import { IntelligenceTab } from '@/components/IntelligenceTab'
import {
  fetchHolders, fetchMetrics, fetchHHI, fetchAlerts,
  fetchShareClasses, fetchCompare, fetchSummary
} from '@/lib/api'
import type {
  Ticker, HolderTypeFilter, TabId,
  Holder, EntityMetrics, HHIScore, Alert, ShareClass, CompareEntity, OwnershipSummary
} from '@/types'

const TABS: { id: TabId; label: string }[] = [
  { id: 'concentration', label: 'Concentration' },
  { id: 'voting',        label: 'Voting vs Economic' },
  { id: 'compare',       label: 'Compare Entities' },
  { id: 'alerts',        label: 'Control Alerts' },
  { id: 'intelligence',  label: 'Intelligence'   },
]

export default function DashboardPage() {
  // Filters
  const [ticker, setTicker]         = useState<Ticker>('NVDA')
  const [holderType, setHolderType] = useState<HolderTypeFilter>('all')
  const [activeTab, setActiveTab]   = useState<TabId>('concentration')

  // Data state
  const [summary,      setSummary]      = useState<OwnershipSummary | null>(null)
  const [holders,      setHolders]      = useState<Holder[]>([])
  const [metrics,      setMetrics]      = useState<EntityMetrics | null>(null)
  const [shareClasses, setShareClasses] = useState<ShareClass[]>([])
  const [hhiScores,    setHhiScores]    = useState<HHIScore[]>([])
  const [alerts,       setAlerts]       = useState<Alert[]>([])
  const [compareData,  setCompareData]  = useState<CompareEntity[]>([])

  // Loading states
  const [loadingHolders,  setLoadingHolders]  = useState(false)
  const [loadingGlobal,   setLoadingGlobal]   = useState(true)

  // Load global data once
  useEffect(() => {
    async function loadGlobal() {
      setLoadingGlobal(true)
      const [sum, hhi, al, cmp] = await Promise.all([
        fetchSummary(), fetchHHI(), fetchAlerts(), fetchCompare()
      ])
      setSummary(sum)
      setHhiScores(hhi)
      setAlerts(al)
      setCompareData(cmp)
      setLoadingGlobal(false)
    }
    loadGlobal()
  }, [])

  // Reload per-ticker data when ticker or holderType changes
  const loadTickerData = useCallback(async () => {
    setLoadingHolders(true)
    const [h, m, sc] = await Promise.all([
      fetchHolders(ticker, holderType),
      fetchMetrics(ticker),
      fetchShareClasses(ticker),
    ])
    setHolders(h)
    setMetrics(m)
    setShareClasses(sc)
    setLoadingHolders(false)
  }, [ticker, holderType])

  useEffect(() => { loadTickerData() }, [loadTickerData])

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text-primary)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Top header */}
      <Header summary={summary} />

      {/* 70/30 layout */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>

        {/* ── Stage (70%) ── */}
        <main style={{ width: '70%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>

          {/* Tab bar */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0 }}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '11px 20px',
                  fontSize: 11, fontFamily: 'var(--font-space-mono)',
                  letterSpacing: '0.06em',
                  color: activeTab === tab.id ? 'var(--cyan)' : 'var(--text-muted)',
                  borderBottom: `2px solid ${activeTab === tab.id ? 'var(--cyan)' : 'transparent'}`,
                  background: 'none', border: 'none',
                  borderBottomStyle: 'solid',
                  borderBottomWidth: 2,
                  borderBottomColor: activeTab === tab.id ? 'var(--cyan)' : 'transparent',
                  cursor: 'pointer', transition: 'color 0.15s',
                  position: 'relative', top: 1,
                }}
              >
                {tab.label.toUpperCase()}
                {/* Alert dot on the Alerts tab */}
                {tab.id === 'alerts' && alerts.some(a => a.level === 'CRITICAL') && (
                  <span style={{ marginLeft: 6, display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#F87171', animation: 'pulse 1.2s infinite', verticalAlign: 'middle' }} />
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
            {loadingHolders && (activeTab === 'concentration' || activeTab === 'voting') && (
              <LoadingSpinner label="Fetching holder data…" />
            )}
            {loadingGlobal && (activeTab === 'compare' || activeTab === 'alerts') && (
              <LoadingSpinner label="Loading…" />
            )}

            {!loadingHolders && activeTab === 'concentration' && (
              <ConcentrationTab holders={holders} metrics={metrics} />
            )}
            {!loadingHolders && activeTab === 'voting' && (
              <VotingTab holders={holders} shareClasses={shareClasses} metrics={metrics} />
            )}
            {!loadingGlobal && activeTab === 'compare' && (
              <CompareTab entities={compareData} />
            )}
            {!loadingGlobal && activeTab === 'alerts' && (
              <AlertsTab alerts={alerts} hhiScores={hhiScores} />
            )}
            {activeTab === 'intelligence' && (
              <IntelligenceTab ticker={ticker}
               />
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: '7px 20px', borderTop: '1px solid var(--border)',
            background: 'var(--surface)', display: 'flex',
            alignItems: 'center', justifyContent: 'space-between',
            fontSize: 9, fontFamily: 'var(--font-space-mono)', color: 'var(--text-muted)',
            flexShrink: 0
          }}>
            <span>
              DATA SOURCES:
              {['SEC EDGAR', 'OPENCORPORATES', 'SYNTHETIC (voting rights)'].map(s => (
                <span key={s} style={{ marginLeft: 6, padding: '2px 6px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 2 }}>{s}</span>
              ))}
            </span>
            <span>FastAPI /v1/ownership · mock_data ACTIVE · Updated 2025-01-15</span>
          </div>
        </main>

        {/* ── Sidebar (30%) ── */}
        <Sidebar
          summary={summary}
          ticker={ticker}
          holderType={holderType}
          onTickerChange={t => { setTicker(t); if (activeTab !== 'compare' && activeTab !== 'alerts') {} }}
          onHolderTypeChange={setHolderType}
        />
      </div>
    </div>
  )
}

function LoadingSpinner({ label }: { label: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: 200, gap: 10, color: 'var(--text-muted)',
      fontFamily: 'var(--font-space-mono)', fontSize: 11, letterSpacing: '0.08em'
    }}>
      <span style={{ width: 14, height: 14, border: '1.5px solid var(--border)', borderTopColor: 'var(--cyan)', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
      {label}
    </div>
  )
}
