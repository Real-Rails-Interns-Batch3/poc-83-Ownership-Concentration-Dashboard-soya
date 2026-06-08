/**
* frontend/src/lib/adapters/opencorporates.ts
*
* Reusable typed adapter for OpenCorporates data via the FastAPI backend proxy.
* Direct browser → OpenCorporates calls are possible but route through the backend
* to keep the API key server-side and manage rate limits centrally.
*/

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface OpenCorporatesCompanyResult {
  status: 'ok' | 'error'
  name?: string
  jurisdiction?: string
  companyNumber?: string
  incorporationDate?: string
  registeredAddress?: string
  detail?: string
}

/**
 * Probe OpenCorporates connectivity for a ticker via the backend proxy.
 * Returns registered name, jurisdiction, company number, incorporation date.
 */
export async function probeOpenCorporates(ticker: string): Promise<OpenCorporatesCompanyResult> {
  const res = await fetch(`${API_BASE}/v1/probe/opencorporates/${ticker.toUpperCase()}`)
  if (!res.ok) throw new Error(`OpenCorporates probe failed: HTTP ${res.status}`)
  return res.json()
}

/**
 * Build an OpenCorporates company URL for linking users to the entity record.
 * jurisdiction: e.g. "us_de" (Delaware), "us_ca" (California)
 * companyNumber: e.g. "2256344"
 */
export function openCorporatesCompanyUrl(jurisdiction: string, companyNumber: string): string {
  return `https://opencorporates.com/companies/${jurisdiction}/${companyNumber}`
}

/**
 * Known jurisdiction + company number pairs for tracked tickers.
 * Used for direct deep-linking to OpenCorporates records.
 */
export const OC_REGISTRY: Record<string, { jurisdiction: string; companyNumber: string }> = {
  NVDA: { jurisdiction: 'us_de', companyNumber: '2256344' },
  GOOG: { jurisdiction: 'us_de', companyNumber: '3764580' },
  META: { jurisdiction: 'us_de', companyNumber: '3548127' },
  AMZN: { jurisdiction: 'us_de', companyNumber: '2473872' },
}