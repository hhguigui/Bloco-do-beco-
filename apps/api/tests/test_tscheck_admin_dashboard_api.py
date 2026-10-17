"""Criterion: Dashboard dentro do admin — API side.

GET /api/stats and POST /api/ai/report must 401 for anonymous callers and 200 for admin.
No pure "dashboard route" API exists outside /admin; the UI-side (no /painel-dados route,
admin tab shows counters) is covered by the browser check admin-dashboard-tab.
"""


def test_stats_requires_admin(client, admin_client):
    r = client.get("/stats")
    assert r.status_code == 401, r.text

    r = admin_client.get("/stats")
    assert r.status_code == 200, r.text
    body = r.json()
    assert "total_talents" in body and "pending_talents" in body


def test_ai_report_requires_admin(client, admin_client):
    r = client.post("/ai/report")
    assert r.status_code == 401, r.text

    # AI report can take 5-30s (Claude) — generous timeout.
    r = admin_client.post("/ai/report", timeout=60.0)
    assert r.status_code == 200, r.text
