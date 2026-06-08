"""
adapters/opencorporates.py — Real OpenCorporates API adapter.

Endpoints used:
  - https://api.opencorporates.com/v0.4/companies/search  (search by name)
  - https://api.opencorporates.com/v0.4/companies/{jurisdiction}/{company_number}
  - https://api.opencorporates.com/v0.4/officers/search   (officers/insiders)

Authentication:
  Set OPENCORPORATES_API_KEY in .env.
  Without a key, the API allows limited unauthenticated requests (rate limited to ~50/day).
  Get a key at: https://opencorporates.com/api_accounts/new

Rate limits:
  Free tier:   500 requests/month
  Pro tier:    varies by plan
  Always send api_token query param or Authorization header.
"""
import os
import httpx
import logging
from typing import Any

logger = logging.getLogger(__name__)

OC_BASE   = "https://api.opencorporates.com/v0.4"
OC_KEY    = os.getenv("OPENCORPORATES_API_KEY", "")   # empty = unauthenticated (limited)

# Known company numbers for the 4 tracked entities
COMPANY_REGISTRY: dict[str, dict[str, str]] = {
    "NVDA": {"jurisdiction": "us_de", "company_number": "2256344",   "canonical_name": "NVIDIA CORPORATION"},
    "GOOG": {"jurisdiction": "us_de", "company_number": "3764580",   "canonical_name": "ALPHABET INC."},
    "META": {"jurisdiction": "us_de", "company_number": "3548127",   "canonical_name": "META PLATFORMS, INC."},
    "AMZN": {"jurisdiction": "us_de", "company_number": "2473872",   "canonical_name": "AMAZON.COM, INC."},
}


class OpenCorporatesAdapter:
    """Async adapter for the OpenCorporates public API."""

    def __init__(self):
        self._client: httpx.AsyncClient | None = None

    def _auth_params(self) -> dict:
        """Return api_token param if key is set, else empty dict."""
        return {"api_token": OC_KEY} if OC_KEY else {}

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                headers={"Accept": "application/json"},
                timeout=15.0,
            )
        return self._client

    async def close(self):
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    async def _get(self, url: str, params: dict | None = None) -> dict[str, Any]:
        client = await self._get_client()
        all_params = {**(params or {}), **self._auth_params()}
        resp = await client.get(url, params=all_params)
        resp.raise_for_status()
        return resp.json()

    # ── Public methods ────────────────────────────────────────────────────────

    async def search_company(self, name: str, jurisdiction: str = "us_de") -> dict[str, Any]:
        """
        Search OpenCorporates for a company by name within a jurisdiction.
        Returns list of matching companies with company number, status, registered address.
        https://api.opencorporates.com/v0.4/companies/search
        """
        url = f"{OC_BASE}/companies/search"
        params = {"q": name, "jurisdiction_code": jurisdiction, "per_page": 5}
        logger.info("OpenCorporates search: %s (%s)", name, jurisdiction)
        return await self._get(url, params)

    async def get_company(self, ticker: str) -> dict[str, Any]:
        """
        Fetch full company record from OpenCorporates by ticker lookup.
        Returns: registered name, jurisdiction, status, officers, filings.
        https://api.opencorporates.com/v0.4/companies/{jurisdiction}/{company_number}
        """
        reg = COMPANY_REGISTRY.get(ticker.upper())
        if not reg:
            raise ValueError(f"No OpenCorporates registry entry for ticker '{ticker}'")
        url = f"{OC_BASE}/companies/{reg['jurisdiction']}/{reg['company_number']}"
        logger.info("OpenCorporates company fetch: %s → %s", ticker, url)
        return await self._get(url)

    async def get_officers(self, ticker: str) -> dict[str, Any]:
        """
        Fetch officers (directors, executives) associated with the company.
        Used to enrich insider holder type classification.
        https://api.opencorporates.com/v0.4/companies/{jurisdiction}/{company_number}/officers
        """
        reg = COMPANY_REGISTRY.get(ticker.upper())
        if not reg:
            raise ValueError(f"No OpenCorporates registry entry for ticker '{ticker}'")
        url = f"{OC_BASE}/companies/{reg['jurisdiction']}/{reg['company_number']}/officers"
        logger.info("OpenCorporates officers fetch: %s", ticker)
        return await self._get(url)

    async def search_officer(self, name: str) -> dict[str, Any]:
        """
        Search for a named individual across all OpenCorporates companies.
        Used to cross-validate insider holder names against registered officer records.
        Returns: list of officer records with company, position, start/end date.
        """
        url = f"{OC_BASE}/officers/search"
        params = {"q": name, "per_page": 10}
        logger.info("OpenCorporates officer search: %s", name)
        return await self._get(url, params)

    async def classify_holder_type(self, holder_name: str, ticker: str) -> str:
        """
        Attempt to classify a holder as institutional / insider / retail
        by cross-referencing the holder name against OpenCorporates officer records
        for the given ticker.

        Returns 'insider' | 'institutional' | 'retail'.
        Falls back to 'institutional' on API error (safe default for large named holders).
        """
        try:
            officers = await self.get_officers(ticker)
            officer_names = [
                o.get("officer", {}).get("name", "").lower()
                for o in officers.get("results", {}).get("officers", [])
            ]
            if any(holder_name.lower() in n or n in holder_name.lower() for n in officer_names):
                return "insider"
            return "institutional"
        except Exception as exc:
            logger.warning("OpenCorporates classify_holder_type failed: %s", exc)
            return "institutional"


# ── Module-level singleton ────────────────────────────────────────────────────
opencorporates = OpenCorporatesAdapter()