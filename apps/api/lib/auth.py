"""Principal + the single authorization decision for talents.

Principals: anonymous · artist (Emergent Google session, cookie `session_token`) ·
admin (password cookie `bdb_admin`, or a Google user whose email is in ADMIN_EMAILS).
Model: RBAC (admin) + ownership (artist owns the talent profiles they created).
"""

import os
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from fastapi import Depends, HTTPException, Request
from pydantic import BaseModel

from lib.db import db
from models.auth import Me, User

ADMIN_COOKIE = "bdb_admin"
SESSION_COOKIE = "session_token"


class Principal(BaseModel):
    user: Optional[User] = None
    is_admin: bool = False

    def me(self) -> Me:
        return Me(user=self.user, is_admin=self.is_admin)


def make_admin_token() -> str:
    payload = {"sub": "admin", "exp": datetime.now(timezone.utc) + timedelta(days=7)}
    return jwt.encode(payload, os.environ["JWT_SECRET"], algorithm="HS256")


def _password_admin(request: Request) -> bool:
    token = request.cookies.get(ADMIN_COOKIE)
    if not token:
        return False
    try:
        jwt.decode(token, os.environ["JWT_SECRET"], algorithms=["HS256"])
        return True
    except jwt.PyJWTError:
        return False


def admin_emails() -> set[str]:
    return {e.strip().lower() for e in os.environ.get("ADMIN_EMAILS", "").split(",") if e.strip()}


def session_token_from(request: Request) -> Optional[str]:
    token = request.cookies.get(SESSION_COOKIE)
    if token:
        return token
    auth = request.headers.get("Authorization", "")
    return auth[7:] if auth.lower().startswith("bearer ") else None


async def _current_user(request: Request) -> Optional[User]:
    token = session_token_from(request)
    if not token:
        return None
    sess = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not sess:
        return None
    expires = sess.get("expires_at")
    if isinstance(expires, str):
        expires = datetime.fromisoformat(expires)
    if isinstance(expires, datetime) and expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if not expires or expires < datetime.now(timezone.utc):
        return None
    doc = await db.users.find_one({"user_id": sess["user_id"]}, {"_id": 0})
    return User(**doc) if doc else None


async def get_principal(request: Request) -> Principal:
    # Re-derived from the DB on every request — no baked role claims.
    user = await _current_user(request)
    is_admin = _password_admin(request) or bool(user and user.email.lower() in admin_emails())
    return Principal(user=user, is_admin=is_admin)


async def require_user(p: Principal = Depends(get_principal)) -> Principal:
    if not p.user:
        raise HTTPException(status_code=401, detail="Entre com sua conta Google para continuar")
    return p


async def require_admin(p: Principal = Depends(get_principal)) -> Principal:
    if not p.is_admin:
        raise HTTPException(status_code=401 if not p.user else 403, detail="Acesso restrito ao administrador")
    return p


def authorize(p: Principal, action: str, talent: dict) -> None:
    """Deny-by-default. Raises 404 when the caller may not even see the talent."""
    is_owner = bool(p.user and talent.get("owner_id") == p.user.user_id)
    if action == "read":
        if talent.get("status") == "approved" or p.is_admin or is_owner:
            return
    elif action in ("update", "delete"):
        if p.is_admin or is_owner:
            return
    elif action == "set_status":
        if p.is_admin:
            return
        if is_owner:
            raise HTTPException(status_code=403, detail="Somente o administrador pode aprovar perfis")
    raise HTTPException(status_code=404, detail="Talento não encontrado")
