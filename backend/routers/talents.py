import re
from collections import Counter
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException

from lib.auth import Principal, authorize, get_principal, require_admin, require_user
from lib.dates import today_iso
from lib.db import db
from lib.geocode import resolve_coords
from models.talent import (
    ACTIVITY_TYPES,
    AGE_RANGES,
    CATEGORIES,
    EXPERIENCES,
    GENDERS,
    ActivityListing,
    CountItem,
    Stats,
    StatusUpdate,
    Summary,
    Talent,
    TalentInput,
    TodayResponse,
)

router = APIRouter()

APPROVED = {"status": "approved"}


def to_talent(doc: dict) -> Talent:
    doc.pop("_id", None)
    doc.setdefault("status", "approved")
    created = doc.get("created_at")
    if isinstance(created, datetime) and created.tzinfo is None:
        doc["created_at"] = created.replace(tzinfo=timezone.utc)
    return Talent(**doc)


def present(t: Talent, p: Principal) -> Talent:
    """Field-level: owner_email is visible to admins only."""
    return t if p.is_admin else t.model_copy(update={"owner_email": ""})


async def all_talents(filt: Optional[dict] = None) -> list[Talent]:
    docs = await db.talents.find(filt or {}, {"_id": 0}).sort("created_at", -1).to_list(5000)
    return [to_talent(d) for d in docs]


async def load(talent_id: str) -> dict:
    doc = await db.talents.find_one({"id": talent_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Talento não encontrado")
    doc.setdefault("status", "approved")
    return doc


@router.get("/today", response_model=TodayResponse)
async def get_today():
    return TodayResponse(today=today_iso())


# ---- public (approved only) -------------------------------------------------
@router.get("/talents", response_model=list[Talent])
async def list_talents(category: Optional[str] = None, q: Optional[str] = None):
    filt: dict = dict(APPROVED)
    if category:
        filt["category"] = category
    if q and q.strip():
        rx = {"$regex": re.escape(q.strip()), "$options": "i"}
        filt["$or"] = [{"name": rx}, {"specialty": rx}, {"bio": rx}, {"activities.title": rx}]
    return [present(t, Principal()) for t in await all_talents(filt)]


@router.get("/talents/{talent_id}", response_model=Talent)
async def get_talent(talent_id: str, p: Principal = Depends(get_principal)):
    doc = await load(talent_id)
    authorize(p, "read", doc)
    return present(to_talent(doc), p)


# ---- artist (Google session) -------------------------------------------------
@router.post("/talents", response_model=Talent, status_code=201)
async def create_talent(payload: TalentInput, p: Principal = Depends(require_user)):
    assert p.user
    lat, lng = await resolve_coords(payload.address, payload.lat, payload.lng)
    talent = Talent(
        **payload.model_dump(exclude={"lat", "lng"}),
        lat=lat,
        lng=lng,
        status="approved" if p.is_admin else "pending",
        owner_id=p.user.user_id,
        owner_email=p.user.email,
    )
    await db.talents.insert_one(talent.model_dump())
    return present(talent, p)


@router.get("/me/talents", response_model=list[Talent])
async def my_talents(p: Principal = Depends(require_user)):
    assert p.user
    return [present(t, p) for t in await all_talents({"owner_id": p.user.user_id})]


@router.put("/talents/{talent_id}", response_model=Talent)
async def update_talent(talent_id: str, payload: TalentInput, p: Principal = Depends(get_principal)):
    existing = await load(talent_id)
    authorize(p, "update", existing)
    current = to_talent(existing)
    lat, lng = await resolve_coords(payload.address, payload.lat, payload.lng)
    # A rejected profile edited by its owner goes back to the approval queue.
    status = "pending" if (current.status == "rejected" and not p.is_admin) else current.status
    updated = Talent(
        **payload.model_dump(exclude={"lat", "lng"}),
        lat=lat,
        lng=lng,
        id=talent_id,
        status=status,
        owner_id=current.owner_id,
        owner_email=current.owner_email,
        created_at=current.created_at,
    )
    await db.talents.replace_one({"id": talent_id}, updated.model_dump())
    return present(updated, p)


@router.delete("/talents/{talent_id}")
async def delete_talent(talent_id: str, p: Principal = Depends(get_principal)):
    authorize(p, "delete", await load(talent_id))
    await db.talents.delete_one({"id": talent_id})
    return {"ok": True}


# ---- admin -------------------------------------------------------------------
@router.get("/admin/talents", response_model=list[Talent])
async def admin_list(status: Optional[str] = None, p: Principal = Depends(require_admin)):
    return await all_talents({"status": status} if status else {})


@router.patch("/talents/{talent_id}/status", response_model=Talent)
async def set_status(talent_id: str, payload: StatusUpdate, p: Principal = Depends(get_principal)):
    doc = await load(talent_id)
    authorize(p, "set_status", doc)
    await db.talents.update_one({"id": talent_id}, {"$set": {"status": payload.status}})
    doc["status"] = payload.status
    return to_talent(doc)

def flatten_activities(talents: list[Talent]) -> list[ActivityListing]:
    return [
        ActivityListing(
            **a.model_dump(),
            talent_id=t.id,
            talent_name=t.name,
            talent_category=t.category,
            talent_photo=t.photo,
            address=t.address,
            phone=t.phone,
            instagram=t.instagram,
        )
        for t in talents
        for a in t.activities
    ]


@router.get("/activities", response_model=list[ActivityListing])
async def list_activities(type: Optional[str] = None, category: Optional[str] = None):
    filt = dict(APPROVED)
    if category:
        filt["category"] = category
    items = flatten_activities(await all_talents(filt))
    if type:
        items = [a for a in items if a.type == type]
    return items


def counts(values: list[str], keys: list[str]) -> list[CountItem]:
    c = Counter(values)
    return [CountItem(key=k, count=c.get(k, 0)) for k in keys]


def is_free(price: str) -> bool:
    return "gratu" in price.lower()


@router.get("/summary", response_model=Summary)
async def get_summary():
    talents = await all_talents(APPROVED)
    acts = [a for t in talents for a in t.activities]
    return Summary(
        total_talents=len(talents),
        total_activities=len(acts),
        free_activities=sum(1 for a in acts if is_free(a.price)),
        by_category=counts([t.category for t in talents], CATEGORIES),
    )


async def compute_stats() -> Stats:
    talents = await all_talents(APPROVED)
    acts = [a for t in talents for a in t.activities]
    return Stats(
        total_talents=len(talents),
        pending_talents=await db.talents.count_documents({"status": "pending"}),
        total_activities=len(acts),
        free_activities=sum(1 for a in acts if is_free(a.price)),
        by_category=counts([t.category for t in talents], CATEGORIES),
        by_gender=counts([t.gender for t in talents], GENDERS),
        by_age=counts([t.age_range for t in talents], AGE_RANGES),
        by_experience=counts([t.experience for t in talents], EXPERIENCES),
        by_activity_type=counts([a.type for a in acts], ACTIVITY_TYPES),
    )


@router.get("/stats", response_model=Stats, dependencies=[Depends(require_admin)])
async def get_stats():
    return await compute_stats()
