from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import json
import os
from typing import Optional
from data import MOCK_DATA, HHI_DATA, ALERTS_DATA, SHARE_CLASSES, COMPARE_DATA, OWNERSHIP_SUMMARY

app = FastAPI(
    title="Real Rails — Ownership Concentration API",
    description="Capital Formation Rail · Real Rails Intelligence Library",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"rail": "Capital Formation", "poc": "Ownership Concentration Dashboard", "status": "mock_data_active"}

@app.get("/v1/ownership/holders")
def get_holders(ticker: str = Query("NVDA"), holder_type: str = Query("all")):
    d = MOCK_DATA.get(ticker, MOCK_DATA["NVDA"])
    holders = d["holders"]
    if holder_type == "institutional":
        holders = [h for h in holders if h["type"] == "institutional"]
    elif holder_type == "insider":
        holders = [h for h in holders if h["type"] == "insider"]
    return {"ticker": ticker, "holders": holders, "source": "SEC EDGAR (mock)", "synthetic_note": "Voting rights are synthetic where SEC disclosure is incomplete"}

@app.get("/v1/ownership/metrics")
def get_metrics(ticker: str = Query("NVDA")):
    d = MOCK_DATA.get(ticker, MOCK_DATA["NVDA"])
    return d["metrics"]

@app.get("/v1/ownership/hhi")
def get_hhi():
    return {"scores": HHI_DATA, "threshold": 2500, "source": "Computed from SEC EDGAR mock data"}

@app.get("/v1/ownership/alerts")
def get_alerts():
    return {"alerts": ALERTS_DATA}

@app.get("/v1/ownership/share-classes")
def get_share_classes(ticker: str = Query("NVDA")):
    return {"ticker": ticker, "classes": SHARE_CLASSES.get(ticker, SHARE_CLASSES["NVDA"])}

@app.get("/v1/ownership/compare")
def get_compare():
    return {"entities": COMPARE_DATA}

@app.get("/v1/ownership/summary")
def get_summary():
    return OWNERSHIP_SUMMARY

@app.get("/v1/ownership/export")
def export_sample():
    export = {
        "_meta": {
            "source": "Real Rails Intelligence Library",
            "rail": "Capital Formation",
            "generated": "2025-01-15",
            "note": "Synthetic voting rights per Real Rails Protocol. Economic data derived from SEC EDGAR / OpenCorporates."
        },
        "ownership_snapshot": [
            {
                "ticker": ticker,
                "holders": MOCK_DATA[ticker]["holders"]
            } for ticker in MOCK_DATA
        ],
        "hhi_scores": HHI_DATA,
        "voting_rights": SHARE_CLASSES,
        "alerts": ALERTS_DATA
    }
    return export