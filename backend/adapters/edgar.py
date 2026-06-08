"""
adapters/edgar.py — Real SEC EDGAR API adapter.

Endpoints used:
  - https://data.sec.gov/submissions/CIK{cik}.json   (company filings index)
  - https://data.sec.gov/api/xbrl/companyfacts/CIK{cik}.json  (XBRL facts)
  - https://efts.sec.gov/LATEST/search-index?q=...   (full-text search)

Set EDGAR_BASE_URL in .env (default: https://data.sec.gov).
No API key required — SEC EDGAR is a public API. Respect rate limits:
  - Max 10 requests/second per SEC fair-use policy.
  - Always send a descriptive User-Agent (required by SEC).
"""
import os
import httpx
import asyncio
import logging
from typing import Any

logger = logging.getLogger(__name__)

EDGAR_BASE      = os.getenv("EDGAR_BASE_URL", "https://data.sec.gov")
EFTS_BASE       = "https://efts.sec.gov"
# SEC requires a descriptive User-Agent: "Sample Company AdminContact@example.com"
USER_AGENT      = os.getenv("EDGAR_USER_AGENT", "RealRailsIntelligence contact@realrails.io")
RATE_LIMIT_SECS = 0.11   # ~9 req/s — safely under SEC's 10 req/s limit

# CIK zero-padded to 10 digits, mapped from ticker
TICKER_TO_CIK: dict[str, str] = {
    "NVDA": "0001045810",
    "GOOG": "0001652044",
    "META": "0001326801",
    "AMZN": "0001018724",
}


class EdgarAdapter:
    """Async adapter for SEC EDGAR public APIs."""

    def __init__(self):
        self._client: httpx.AsyncClient | None = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                headers={"User-Agent": USER_AGENT, "Accept-Encoding": "gzip"},
                timeout=20.0,
            )
        return self._client

    async def close(self):
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    async def _get(self, url: str) -> dict[str, Any]:
        client = await self._get_client()
        await asyncio.sleep(RATE_LIMIT_SECS)
        resp = client.get(url)
        if asyncio.iscoroutine(resp):
            resp = await resp
        resp.raise_for_status()
        return resp.json()

    # ── Public methods ────────────────────────────────────────────────────────

    async def get_submissions(self, ticker: str) -> dict[str, Any]:
        """
        Fetch the full submissions JSON for a company by ticker.
        Returns filing metadata including accession numbers, form types, dates.
        https://data.sec.gov/submissions/CIK{cik}.json
        """
        cik = TICKER_TO_CIK.get(ticker.upper())
        if not cik:
            raise ValueError(f"No CIK mapping for ticker '{ticker}'")
        url = f"{EDGAR_BASE}/submissions/CIK{cik}.json"
        logger.info("EDGAR submissions: GET %s", url)
        return await self._get(url)

    async def get_company_facts(self, ticker: str) -> dict[str, Any]:
        """
        Fetch XBRL company facts (all financial/governance data points ever filed).
        Includes InstitutionalOwnership, SharesOutstanding, etc.
        https://data.sec.gov/api/xbrl/companyfacts/CIK{cik}.json
        """
        cik = TICKER_TO_CIK.get(ticker.upper())
        if not cik:
            raise ValueError(f"No CIK mapping for ticker '{ticker}'")
        url = f"{EDGAR_BASE}/api/xbrl/companyfacts/CIK{cik}.json"
        logger.info("EDGAR company facts: GET %s", url)
        return await self._get(url)

    async def search_13f_filings(self, ticker: str, count: int = 5) -> dict[str, Any]:
        """
        Search EDGAR full-text for the most recent 13F filings for a ticker.
        Returns a list of filing accession numbers, dates, and URLs.
        https://efts.sec.gov/LATEST/search-index?q=...
        """
        cik = TICKER_TO_CIK.get(ticker.upper())
        if not cik:
            raise ValueError(f"No CIK mapping for ticker '{ticker}'")
        url = (
            f"{EFTS_BASE}/LATEST/search-index"
            f"?q=%22{cik}%22&dateRange=custom&startdt=2023-01-01"
            f"&forms=13F-HR&hits.hits.total.value=true&hits.hits._source=period_of_report,file_date,form_type,entity_name"
        )
        logger.info("EDGAR 13F search: GET %s", url)
        return await self._get(url)

    async def get_13f_holding_xml(self, accession_number: str, cik: str) -> str:
        """
        Fetch the raw 13F holdings XML for a specific accession number.
        accession_number format: "0001234567-24-012345" (with dashes)
        """
        acc_nodash = accession_number.replace("-", "")
        url = (
            f"{EDGAR_BASE}/Archives/edgar/data/{int(cik)}/{acc_nodash}/"
            f"primary_doc.xml"
        )
        logger.info("EDGAR 13F XML: GET %s", url)
        client = await self._get_client()
        await asyncio.sleep(RATE_LIMIT_SECS)
        resp = await client.get(url)
        resp.raise_for_status()
        return resp.text

    async def get_def14a_proxy(self, ticker: str) -> dict[str, Any]:
        """
        Fetch the most recent DEF 14A (proxy statement) for a ticker.
        Used to extract voting structure, share class multipliers, insider stakes.
        """
        cik = TICKER_TO_CIK.get(ticker.upper())
        if not cik:
            raise ValueError(f"No CIK mapping for ticker '{ticker}'")
        url = (
            f"{EFTS_BASE}/LATEST/search-index"
            f"?q=%22{cik}%22&forms=DEF+14A&hits.hits._source=period_of_report,file_date,form_type,entity_name"
        )
        logger.info("EDGAR DEF 14A search: GET %s", url)
        return await self._get(url)

    async def get_form4_insider(self, ticker: str, count: int = 10) -> dict[str, Any]:
        """
        Fetch the most recent Form 4 (insider transaction) filings for a ticker.
        T+2 publication window — do not cache beyond this cadence (see Privacy mitigations).
        """
        cik = TICKER_TO_CIK.get(ticker.upper())
        if not cik:
            raise ValueError(f"No CIK mapping for ticker '{ticker}'")
        url = (
            f"{EFTS_BASE}/LATEST/search-index"
            f"?q=%22{cik}%22&forms=4&hits.hits._source=period_of_report,file_date,form_type,entity_name"
        )
        logger.info("EDGAR Form 4 search: GET %s", url)
        return await self._get(url)


# ── Module-level singleton ────────────────────────────────────────────────────
edgar = EdgarAdapter()