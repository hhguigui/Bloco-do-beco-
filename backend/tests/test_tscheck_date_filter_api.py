"""Criterion: Filtro de data para eventos e atividades — API side.

GET /api/today returns the server-anchored date (America/Sao_Paulo) used as the anchor
for the Hoje/7-dias/mes presets; GET /api/activities exposes a `date` (or null for
recurring) per activity so the frontend can restrict to range.
"""

import re
from datetime import datetime, timezone


def test_today_endpoint_returns_iso_date(client):
    r = client.get("/today")
    assert r.status_code == 200, r.text
    today = r.json()["today"]
    assert re.match(r"^\d{4}-\d{2}-\d{2}$", today), today

    # sanity: within a day of UTC "now" (Sao_Paulo is UTC-3, so same or previous day)
    now_utc = datetime.now(timezone.utc).date()
    delta = abs((now_utc - datetime.strptime(today, "%Y-%m-%d").date()).days)
    assert delta <= 1


def test_activities_expose_date_field_for_cascade_filtering(client):
    r = client.get("/activities")
    assert r.status_code == 200, r.text
    activities = r.json()
    assert isinstance(activities, list) and len(activities) > 0
    for a in activities:
        assert "date" in a  # present (string) or explicit null for recurring
    dated = [a for a in activities if a["date"]]
    assert all(re.match(r"^\d{4}-\d{2}-\d{2}$", a["date"]) for a in dated)
