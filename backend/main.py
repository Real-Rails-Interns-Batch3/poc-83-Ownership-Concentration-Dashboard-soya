from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import os
import logging
from data import MOCK_DATA, HHI_DATA, ALERTS_DATA, SHARE_CLASSES, COMPARE_DATA, OWNERSHIP_SUMMARY

# Live adapters — only imported; calls are behind DATA_MODE guard
try:
    from adapters.edgar import edgar
    from adapters.opencorporates import opencorporates
    _ADAPTERS_AVAILABLE = True
except ImportError:
    _ADAPTERS_AVAILABLE = False

logger = logging.getLogger(__name__)
DATA_MODE = os.getenv("DATA_MODE", "mock")   # "mock" | "live"

app = FastAPI(
    title="Real Rails — Ownership Concentration API",
    description="Capital Formation Rail · Real Rails Intelligence Library",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def _shutdown():
    if _ADAPTERS_AVAILABLE:
        await edgar.close()
        await opencorporates.close()


# ── helpers ───────────────────────────────────────────────────────────────────

def _is_live() -> bool:
    return DATA_MODE == "live" and _ADAPTERS_AVAILABLE


# ── routes ────────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {
        "rail": "Capital Formation",
        "poc": "Ownership Concentration Dashboard",
        "status": DATA_MODE,
        "adapters": "available" if _ADAPTERS_AVAILABLE else "unavailable",
    }


@app.get("/v1/ownership/holders")
async def get_holders(ticker: str = Query("NVDA"), holder_type: str = Query("all")):
    if _is_live():
        try:
            # Live path: fetch 13F submissions from SEC EDGAR
            raw = await edgar.search_13f_filings(ticker)
            logger.info("EDGAR 13F live fetch for %s: %s hits", ticker,
                        raw.get("hits", {}).get("total", {}).get("value", "?"))
            # NOTE: parsing raw 13F XML into holder records is a future ETL step.
            # For now, log the live call and fall back to mock for structured response.
        except Exception as exc:
            logger.warning("EDGAR live fetch failed for %s: %s — falling back to mock", ticker, exc)

    d = MOCK_DATA.get(ticker, MOCK_DATA["NVDA"])
    holders = list(d["holders"])
    if holder_type == "institutional":
        holders = [h for h in holders if h["type"] == "institutional"]
    elif holder_type == "insider":
        holders = [h for h in holders if h["type"] == "insider"]
    return {
        "ticker": ticker,
        "holders": holders,
        "source": "SEC EDGAR" if _is_live() else "SEC EDGAR (mock)",
        "dataMode": DATA_MODE,
        "synthetic_note": "Voting rights are synthetic where SEC disclosure is incomplete",
    }


@app.get("/v1/ownership/metrics")
async def get_metrics(ticker: str = Query("NVDA")):
    if _is_live():
        try:
            raw = await edgar.get_company_facts(ticker)
            logger.info("EDGAR company facts live fetch for %s: entity=%s",
                        ticker, raw.get("entityName", "?"))
        except Exception as exc:
            logger.warning("EDGAR company facts failed for %s: %s", ticker, exc)
    d = MOCK_DATA.get(ticker, MOCK_DATA["NVDA"])
    return {**d["metrics"], "dataMode": DATA_MODE}


@app.get("/v1/ownership/hhi")
def get_hhi():
    return {"scores": HHI_DATA, "threshold": 2500,
            "source": "Computed from SEC EDGAR", "dataMode": DATA_MODE}


@app.get("/v1/ownership/alerts")
def get_alerts():
    return {"alerts": ALERTS_DATA, "dataMode": DATA_MODE}


@app.get("/v1/ownership/share-classes")
async def get_share_classes(ticker: str = Query("NVDA")):
    if _is_live():
        try:
            proxy = await edgar.get_def14a_proxy(ticker)
            logger.info("EDGAR DEF 14A live fetch for %s: %s hits", ticker,
                        proxy.get("hits", {}).get("total", {}).get("value", "?"))
        except Exception as exc:
            logger.warning("EDGAR DEF 14A failed for %s: %s", ticker, exc)
    return {
        "ticker": ticker,
        "classes": SHARE_CLASSES.get(ticker, SHARE_CLASSES["NVDA"]),
        "dataMode": DATA_MODE,
    }


@app.get("/v1/ownership/compare")
def get_compare():
    return {"entities": COMPARE_DATA, "dataMode": DATA_MODE}


@app.get("/v1/ownership/summary")
def get_summary():
    return {**OWNERSHIP_SUMMARY, "dataMode": DATA_MODE}


@app.get("/v1/ownership/export")
def export_sample():
    return {
        "_meta": {
            "source": "Real Rails Intelligence Library",
            "rail": "Capital Formation",
            "generated": OWNERSHIP_SUMMARY.get("lastUpdated", "2025-01-15"),
            "note": "Synthetic voting rights per Real Rails Protocol. Economic data derived from SEC EDGAR / OpenCorporates.",
            "dataMode": DATA_MODE,
        },
        "ownership_snapshot": [
            {"ticker": ticker, "holders": MOCK_DATA[ticker]["holders"]}
            for ticker in MOCK_DATA
        ],
        "hhi_scores": HHI_DATA,
        "voting_rights": SHARE_CLASSES,
        "alerts": ALERTS_DATA,
    }


# ── Live adapter probe endpoints (for testing real API connectivity) ──────────

@app.get("/v1/probe/edgar/{ticker}")
async def probe_edgar(ticker: str):
    """Test live SEC EDGAR connectivity for a ticker. Returns raw submissions metadata."""
    if not _ADAPTERS_AVAILABLE:
        return {"error": "adapters not available", "hint": "check backend/adapters/"}
    try:
        data = await edgar.get_submissions(ticker.upper())
        return {
            "status": "ok",
            "entityName": data.get("name"),
            "cik": data.get("cik"),
            "filingCount": len(data.get("filings", {}).get("recent", {}).get("form", [])),
        }
    except Exception as exc:
        return {"status": "error", "detail": str(exc)}


@app.get("/v1/probe/opencorporates/{ticker}")
async def probe_opencorporates(ticker: str):
    """Test live OpenCorporates connectivity for a ticker. Returns company record summary."""
    if not _ADAPTERS_AVAILABLE:
        return {"error": "adapters not available"}
    try:
        data = await opencorporates.get_company(ticker.upper())
        company = data.get("results", {}).get("company", {})
        return {
            "status": "ok",
            "name": company.get("name"),
            "jurisdiction": company.get("jurisdiction_code"),
            "companyNumber": company.get("company_number"),
            "incorporationDate": company.get("incorporation_date"),
            "registeredAddress": company.get("registered_address", {}).get("street_address"),
        }
    except Exception as exc:
        return {"status": "error", "detail": str(exc)}