/**
 * frontend/src/lib/adapters/edgar.ts
 *
 * Reusable typed adapter for the SEC EDGAR public API.
 * All calls go through the FastAPI backend proxy (/v1/probe/edgar/*)
 * so the browser never hits SEC EDGAR directly (avoids CORS, respects rate limits).
 *
 * For direct browser → EDGAR calls (advanced), EDGAR's EFTS API supports CORS,
 * but rate limiting and User-Agent requirements make backend proxying preferable.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface EdgarSubmissionsResult {
  entityName: string
  cik: string
  filingCount: number
  status: 'ok' | 'error'
  detail?: string
}

export interface EdgarFilingRef {
  accessionNumber: string
  filingDate: string
  formType: string
  primaryDocument: string
}

/**
 * Probe SEC EDGAR connectivity for a ticker via the backend proxy.
 * Returns entity name, CIK, and recent filing count.
 */
export async function probeEdgar(ticker: string): Promise<EdgarSubmissionsResult> {
  const res = await fetch(`${API_BASE}/v1/probe/edgar/${ticker.toUpperCase()}`)
  if (!res.ok) throw new Error(`EDGAR probe failed: HTTP ${res.status}`)
  return res.json()
}

/**
 * Fetch 13F filing metadata for a ticker via the backend.
 * Returns structured list of recent institutional holdings reports.
 */
export async function fetch13FFilings(ticker: string): Promise<EdgarFilingRef[]> {
  const res = await fetch(`${API_BASE}/v1/ownership/holders?ticker=${ticker.toUpperCase()}`)
  if (!res.ok) throw new Error(`13F fetch failed: HTTP ${res.status}`)
  const data = await res.json()
  // Extract filing references from the holders response if present
  return (data.filings ?? []) as EdgarFilingRef[]
}

/**
 * Build a direct EDGAR filing URL from an accession number and CIK.
 * Useful for linking users to the original SEC document.
 */
export function edgarFilingUrl(cik: string, accessionNumber: string): string {
  const acc = accessionNumber.replace(/-/g, '')
  return `https://www.sec.gov/Archives/edgar/data/${parseInt(cik)}/${acc}/`
}

/**
 * Build an EDGAR company search URL for a given ticker.
 */
export function edgarCompanyUrl(ticker: string): string {
  return `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&company=${ticker}&type=13F&dateb=&owner=include&count=10`
}