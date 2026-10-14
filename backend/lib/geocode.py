"""Address → coordinates via OpenStreetMap Nominatim, bounded to the Jardim Ibirapuera area (Zona Sul, SP)."""

import logging
import random
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

CENTER = (-23.6635, -46.7330)
VIEWBOX = "-46.80,-23.62,-46.68,-23.72"  # lon1,lat1,lon2,lat2
NOMINATIM = "https://nominatim.openstreetmap.org/search"


async def geocode(address: str) -> Optional[tuple[float, float]]:
    params = {"q": f"{address}, São Paulo", "format": "json", "limit": 1, "viewbox": VIEWBOX, "bounded": 1}
    try:
        async with httpx.AsyncClient(timeout=8, headers={"User-Agent": "BlocoDoBeco/1.0 (mapeamento cultural)"}) as c:
            res = await c.get(NOMINATIM, params=params)
            data = res.json() if res.status_code == 200 else []
        if data:
            return float(data[0]["lat"]), float(data[0]["lon"])
    except Exception as exc:  # network issues must never block a registration
        logger.warning("geocode failed for %r: %s", address, exc)
    return None


async def resolve_coords(address: str, lat: Optional[float], lng: Optional[float]) -> tuple[float, float]:
    if lat is not None and lng is not None:
        return lat, lng
    found = await geocode(address)
    if found:
        return found
    # Fallback: approximate point inside the neighbourhood so the talent still shows on the map.
    return CENTER[0] + random.uniform(-0.004, 0.004), CENTER[1] + random.uniform(-0.004, 0.004)
