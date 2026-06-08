
import json
import os

_HERE = os.path.dirname(__file__)
_JSON_PATH = os.path.join(_HERE, "mock_data.json")

with open(_JSON_PATH, "r", encoding="utf-8") as _f:
    _DB = json.load(_f)

# ── Public exports (same names as before so main.py is unchanged) ─────────────

def _holders_dict(ticker: str) -> dict:
    """Return the legacy MOCK_DATA[ticker] shape expected by main.py."""
    return {
        "holders": _DB["holders"].get(ticker, []),
        "metrics": _DB["metrics"].get(ticker, {}),
    }

# Legacy dict used by main.py  (MOCK_DATA["NVDA"]["holders"] etc.)
MOCK_DATA = {t: _holders_dict(t) for t in _DB["holders"]}

HHI_DATA          = _DB["hhi"]
ALERTS_DATA       = _DB["alerts"]
SHARE_CLASSES     = _DB["shareClasses"]
COMPARE_DATA      = _DB["compare"]
OWNERSHIP_SUMMARY = _DB["summary"]