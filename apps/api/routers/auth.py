import hmac
import os
import uuid
from datetime import datetime, timedelta, timezone

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pymongo import ASCENDING, DESCENDING

from lib.auth import (
    ADMIN_COOKIE,
    SESSION_COOKIE,
    Principal,
    get_principal,
    make_admin_token,
    session_token_from,
    require_admin,
    require_user,
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


@router.get("/admin/users", response_model=list[User])
async def list_users(p: Principal = Depends(require_admin)):
    docs = await db.users.find({}, {"_id": 0}).sort([("created_at", DESCENDING), ("email", ASCENDING)]).to_list()
    return [User(**d) for d in docs if "user_id" in d]


@router.patch("/me/role", response_model=Me)
async def update_my_role(payload: dict, p: Principal = Depends(require_user)):
    """Allow logged-in users to set their own role to customer or talent."""
    assert p.user
    role = payload.get("role")
    if role not in ("customer", "talent"):
        raise HTTPException(status_code=422, detail="Role deve ser 'customer' ou 'talent'")
    await db.users.update_one(
        {"user_id": p.user.user_id},
        {"$set": {"role": role}},
    )
    updated = await db.users.find_one({"user_id": p.user.user_id}, {"_id": 0})
    user = User(**updated)
    return Me(user=user, is_admin=p.is_admin)


@router.patch("/me/phone", response_model=Me)
async def update_my_phone(payload: dict, p: Principal = Depends(require_user)):
    """Allow logged-in users to add/remove phone numbers."""
    assert p.user
    action = payload.get("action", "add")  # "add" or "remove"
    phone = payload.get("phone", "").strip()
    
    # Get current phones
    existing = await db.users.find_one({"user_id": p.user.user_id}, {"_id": 0})
    phones = existing.get("phones", []) if existing else []
    
    if action == "add":
        if phone and len(phone) >= 10 and phone not in phones:
            phones.append(phone)
    elif action == "remove" and phone in phones:
        phones.remove(phone)
    
    await db.users.update_one(
        {"user_id": p.user.user_id},
        {"$set": {"phones": phones}},
    )
    updated = await db.users.find_one({"user_id": p.user.user_id}, {"_id": 0})
    user = User(**updated)
    return Me(user=user, is_admin=p.is_admin)


@router.patch("/admin/users/{user_id}/role", response_model=Me)
async def admin_update_user_role(user_id: str, payload: dict, p: Principal = Depends(require_admin)):
    """Admin can change any user's role."""
    role = payload.get("role")
    if role not in ("customer", "talent"):
        raise HTTPException(status_code=422, detail="Role deve ser 'customer' ou 'talent'")
    existing = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    await db.users.update_one({"user_id": user_id}, {"$set": {"role": role}})
    updated = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    user = User(**updated)
    return Me(user=user, is_admin=p.is_admin)


@router.post("/logout", response_model=Me)
async def logout(request: Request, response: Response):
    token = session_token_from(request)
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    response.delete_cookie(ADMIN_COOKIE, path="/")
    response.delete_cookie(SESSION_COOKIE, path="/", secure=True, samesite="none")
    return Me()
