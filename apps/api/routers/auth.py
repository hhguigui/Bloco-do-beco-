import hmac
import os
import uuid
from datetime import datetime, timedelta, timezone

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, Response

from lib.auth import (
    ADMIN_COOKIE,
    SESSION_COOKIE,
    Principal,
    get_principal,
    make_admin_token,
    session_token_from,
)
from lib.db import db
from models.auth import LoginRequest, Me, SessionRequest, User

router = APIRouter(prefix="/auth")

EMERGENT_SESSION_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"


@router.post("/login", response_model=Me)
async def admin_login(payload: LoginRequest, response: Response):
    """Admin password login (kept alongside Google)."""
    from lib.auth import admin_emails
    
    if payload.email.lower() not in admin_emails():
        raise HTTPException(status_code=401, detail="Email não autorizado para acesso administrativo")
    if not hmac.compare_digest(payload.password, os.environ["ADMIN_PASSWORD"]):
        raise HTTPException(status_code=401, detail="Senha incorreta")
    
    # Create or lookup admin user
    email = payload.email.lower()
    user_id = f"admin_{email.split('@')[0]}"
    now = datetime.now(timezone.utc)
    await db.users.update_one(
        {"user_id": user_id},
        {
            "$set": {"email": email, "name": email.split('@')[0], "picture": ""},
            "$setOnInsert": {"user_id": user_id, "created_at": now},
        },
        upsert=True,
    )
    
    response.set_cookie(ADMIN_COOKIE, make_admin_token(), httponly=True, samesite="lax", max_age=7 * 24 * 3600, path="/")
    user = User(user_id=user_id, email=email, name=email.split('@')[0], picture="")
    return Me(user=user, is_admin=True)


@router.post("/session", response_model=Me)
async def google_session(payload: SessionRequest, response: Response):
    """Exchange the Emergent Google Auth session_id for a 7-day session cookie."""
    async with httpx.AsyncClient(timeout=15) as c:
        res = await c.get(EMERGENT_SESSION_URL, headers={"X-Session-ID": payload.session_id})
    if res.status_code != 200:
        raise HTTPException(status_code=401, detail="Não foi possível validar o login com Google")
    data = res.json()
    email = str(data["email"]).lower()
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    user_id = existing["user_id"] if existing else f"user_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)
    await db.users.update_one(
        {"user_id": user_id},
        {
            "$set": {"email": email, "name": data.get("name") or email, "picture": data.get("picture") or ""},
            "$setOnInsert": {"user_id": user_id, "created_at": now},
        },
        upsert=True,
    )
    token = data["session_token"]
    await db.user_sessions.insert_one(
        {"user_id": user_id, "session_token": token, "expires_at": now + timedelta(days=7), "created_at": now}
    )
    response.set_cookie(
        SESSION_COOKIE, token, httponly=True, secure=True, samesite="none", max_age=7 * 24 * 3600, path="/"
    )
    user = User(**(await db.users.find_one({"user_id": user_id}, {"_id": 0})))
    from lib.auth import admin_emails  # local import keeps the public surface small

    return Me(user=user, is_admin=email in admin_emails())


@router.get("/me", response_model=Me)
async def me(p: Principal = Depends(get_principal)):
    # Anonymous → {user: null, is_admin: false} (200) so the header can probe without console noise.
    return p.me()


@router.post("/logout", response_model=Me)
async def logout(request: Request, response: Response):
    token = session_token_from(request)
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    response.delete_cookie(ADMIN_COOKIE, path="/")
    response.delete_cookie(SESSION_COOKIE, path="/", secure=True, samesite="none")
    return Me()
