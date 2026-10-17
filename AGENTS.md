# Bloco do Beco — Agent Quick Reference

## Application Summary
Cultural collective platform mapping artists/talents in **Jardim Ibirapuera, Zona Sul, São Paulo**. Talents offer activities (oficinas, aulas, serviços, eventos) to the community. **Monorepo** with:
- **API** (`apps/api/`) — FastAPI + MongoDB backend
- **Web** (`apps/web/`) — React 19 + Vite + Tailwind CSS frontend
- **Tests** (`apps/tests/`) — Playwright e2e tests

---

## Architecture & Entry Points

| Layer | Path | Notes |
|-------|------|-------|
| **API Server** | `apps/api/server.py` | FastAPI app, lifespan starts index build in background |
| **API Routers** | `apps/api/routers/` | `auth.py`, `talents.py`, `ai.py` |
| **API Models** | `apps/api/models/` | Pydantic v2; `talent.py` = domain, `auth.py` = auth DTOs, `ai.py` = AI requests |
| **API Lib** | `apps/api/lib/` | `db.py` (Mongo client + indexes), `auth.py` (RBAC + ownership), `geocode.py` (OSM Nominatim), `ai.py` (Claude SSE), `dates.py` (server-side today) |
| **API Seed** | `apps/api/seed.py` | Idempotent: 10 example talents with `status=approved` |
| **Frontend** | `apps/web/` | React 19, Vite, Tailwind CSS 4, React Router 7, TanStack Query |
| **E2E Tests** | `apps/tests/` | Playwright (chromium desktop + mobile) |

**Database**: MongoDB (collections: `talents`, `users`, `user_sessions`, `status_checks`, `ai_logs`). Indexes defined in `apps/api/lib/db.py:INDEXES` and applied at startup via `ensure_indexes()`.

---

## Authentication & Authorization

**Principals** (from `apps/api/lib/auth.py`):
- **Anonymous** — no session
- **Artist** — Google OAuth via Emergent (`session_token` cookie, 7-day TTL)
- **Admin** — password cookie `bdb_admin` (JWT, 7-day) **OR** Google user with email in `ADMIN_EMAILS` env

**Authorization rules** (`apps/api/lib/auth.py:authorize`):
| Action | Who |
|--------|-----|
| `read` | Public if `status=approved`; owner or admin always |
| `update` / `delete` | Owner or admin |
| `set_status` | **Admin only** (owner gets 403) |

**Key dependencies** (in `apps/api/lib/auth.py`):
- `get_principal` → `Principal(user?, is_admin)`
- `require_user` → 401 if anonymous
- `require_admin` → 401/403 if not admin

---

## Talent Lifecycle & Status Flow

```
Artist creates (POST /api/talents) 
    → status = "pending" (or "approved" if admin)
    → visible only to owner + admins

Admin PATCH /api/talents/{id}/status {"status": "approved"}
    → publicly visible in listings & detail

Owner edits rejected talent
    → status reverts to "pending" (re-approval needed)
```

**Public endpoints** (`/api/talents`, `/api/talents/{id}`, `/api/activities`, `/api/summary`) return **only `status=approved`**.

---

## AI Features (Claude Sonnet 4.5 via `emergentintegrations`)

All endpoints stream SSE (`text/event-stream`):

| Endpoint | Purpose | Auth |
|----------|---------|------|
| `POST /api/ai/recommend` | Resident asks → recommends ≤3 talents with markdown links `[Nome](/talento/ID)` | Public |
| `POST /api/ai/bio` | Generates 60–110 word bio from name/category/specialty/notes | Public |
| `POST /api/ai/report` | Admin-only analytics report (stats + sample) | Admin |

Logs stored in `ai_logs` collection. **Graceful fallback**: if `emergentintegrations` not installed (local dev), returns mock responses.

---

## Developer Commands

```bash
# ===== API (Backend) =====
cd apps/api
python3 -m venv .venv && source .venv/bin/activate   # create + activate venv
pip install -r requirements.txt                      # install deps
python -m uvicorn server:app --reload --port 8001    # dev server (needs MongoDB running)
python seed.py                                       # seed example talents

# API Tests — run inside the same venv
cd apps/api
pytest                          # all tests (xdist -n 2, loadscope)
pytest tests/test_tscheck_admin_approval.py  # single file
pytest -n 0                     # serial (no xdist)

# ===== Web (Frontend) =====
cd apps/web
yarn install                    # install deps
yarn dev                        # Vite dev server (proxies /api to :8001)
yarn build                      # production build
yarn lint                       # oxlint
yarn typecheck                  # tsc --noEmit

# ===== E2E Tests (Playwright) =====
cd apps/tests
yarn install
yarn playwright test            # chromium desktop + mobile
```

**⚠️ Known issue**: `emergentintegrations==0.2.2` (used for Claude AI streaming in `apps/api/lib/ai.py`) is **not on public PyPI** — it's an internal Emergent platform package. Install will fail on Python 3.13+. Workarounds:
- Use Python ≤3.11 if the package was previously published for those versions
- Or mock/replace the AI streaming logic in `apps/api/lib/ai.py` for local development (already implemented: graceful fallback to mock)
- The package may be available via a private index in the deployment environment

**Environment variables** (`.env` in `apps/api/`):
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=app
JWT_SECRET=...
ADMIN_PASSWORD=beco2026
ADMIN_EMAILS=admin1@example.com,admin2@example.com
EMERGENT_LLM_KEY=...
EMERGENT_SESSION_URL=https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data
CORS_ORIGINS=http://localhost:3000,https://preview.domain
APP_TZ=America/Sao_Paulo
```

**Frontend `.env`** (`apps/web/.env`):
```
VITE_API_URL=http://localhost:8001/api
```

---

## Testing Notes

- **API tests** hit a **live uvicorn** (managed by supervisor), not in-process ASGI. Fixtures in `apps/api/tests/conftest.py` create real Mongo users/sessions.
- `artist_session` fixture inserts a user + session_token directly in Mongo.
- `admin_client` fixture logs in via password (`ADMIN_PASSWORD`).
- `pytest.ini` forces `-n 2 --dist loadscope` — do NOT modify.
- Run `pytest -n 0` for serial debugging.
- **E2E tests** use Playwright with baseURL `http://localhost:3000` (Vite dev server).

---

## Common Gotchas

1. **Index build is async** — `ensure_indexes()` runs in background task at startup; first requests may hit unindexed collections.
2. **Geocoding fallback** — If Nominatim fails, `resolve_coords()` returns a random point near Jardim Ibirapuera center so the talent still appears on map.
3. **Owner email hidden** — `owner_email` only returned to admins (`talents.py:present()`).
4. **SSE streaming** — AI endpoints return `StreamingResponse`; clients must handle `data: {...}\n\n` events.
5. **Frontend proxies `/api`** — Vite config proxies `/api` to `http://localhost:8001`; both servers must run for full dev.
6. **React 19 + Vite 8** — Uses `@tailwindcss/vite` plugin for Tailwind CSS 4; oxlint for linting.