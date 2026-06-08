"""
Real Rails — Backend Data Adapters
"""
from .edgar import edgar, EdgarAdapter
from .opencorporates import opencorporates, OpenCorporatesAdapter

__all__ = ["edgar", "EdgarAdapter", "opencorporates", "OpenCorporatesAdapter"]