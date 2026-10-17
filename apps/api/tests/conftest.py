"""Pre-scaffolded pytest fixtures for the FastAPI backend.

Tests hit the live uvicorn process managed by supervisor (not an in-process ASGI app), so
the app under test is the same one the frontend and Playwright see. Do NOT re-create this
file — add app-specific fixtures below the marker at the bottom.
"""

import os

import httpx
import pytest
import pytest_asyncio

BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:8001")
API_URL = f"{BACKEND_URL}/api"


def api_url(path: str = "") -> str:
    """Absolute URL for an /api route: api_url("/status") -> http://localhost:8001/api/status."""
    return f"{API_URL}{path}"


@pytest.fixture(scope="session")
def backend_url() -> str:
    return BACKEND_URL


@pytest.fixture
def client():
    """Sync httpx client rooted at /api — the default for endpoint tests.

    Example:
        def test_status(client):
            assert client.get("/status").status_code == 200
    """
    with httpx.Client(base_url=API_URL, timeout=30.0) as c:
        yield c


@pytest_asyncio.fixture
async def aclient():
    """Async variant, for tests that also await motor/backend helpers directly."""
    async with httpx.AsyncClient(base_url=API_URL, timeout=30.0) as c:
        yield c


# --- app-specific fixtures below this line ---

import time
import uuid
from datetime import datetime, timedelta, timezone

import pymongo

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "app")


def _mongo_db():
    return pymongo.MongoClient(MONGO_URL)[DB_NAME]


@pytest.fixture
def artist_session():
    """Create a real user + session_token directly in Mongo (per /app/auth_testing.md)."""
    db = _mongo_db()
    suffix = f"{int(time.time())}-{uuid.uuid4().hex[:6]}"
    user_id = f"tscheck-user-{suffix}"
    token = f"tscheck_session_{suffix}"
    email = f"tscheck.{suffix}@example.com"
    db.users.insert_one({"user_id": user_id, "email": email, "name": "TsCheck Artist", "picture": "", "created_at": datetime.now(timezone.utc)})
    db.user_sessions.insert_one({"user_id": user_id, "session_token": token, "expires_at": datetime.now(timezone.utc) + timedelta(days=1), "created_at": datetime.now(timezone.utc)})
    yield {"user_id": user_id, "token": token, "email": email}
    db.user_sessions.delete_many({"user_id": user_id})
    db.users.delete_many({"user_id": user_id})


@pytest.fixture
def admin_client():
    """httpx client authenticated as admin via password login (bdb_admin cookie)."""
    with httpx.Client(base_url=API_URL, timeout=30.0) as c:
        r = c.post("/auth/login", json={"password": os.environ.get("ADMIN_PASSWORD", "beco2026")})
        assert r.status_code == 200, r.text
        yield c
