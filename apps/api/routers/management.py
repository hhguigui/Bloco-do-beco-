from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from lib.auth import Principal, get_principal, require_admin, require_user
from lib.db import db
from models.reports import Report, ReportCreate, Observation, ObservationCreate, Participation
from pydantic import BaseModel


router = APIRouter()

APPROVED = {"status": "approved"}

@router.post("/talents/{talent_id}/reports", status_code=201)
async def create_report(talent_id: str, payload: ReportCreate, p: Principal = Depends(get_principal)):
      # Verifica se talento existe
      talent = await db.talents.find_one({"id": talent_id})
      if not talent:
          raise HTTPException(status_code=404, detail="Talento não encontrado")

      # Denúncia anônima ou por usuário logado (sem expor identidade ao talento)
      report = Report(
          talent_id=talent_id,
          reporter_user_id=p.user.user_id if p.user else None,
          reporter_email=p.user.email if p.user else None,
          message=payload.message
      )
      await db.reports.insert_one(report.model_dump())
      return {"ok": True, "message": "Denúncia enviada com sucesso e sigilo garantido."}


@router.get("/admin/talents/{talent_id}/reports", response_model=list[Report])
async def get_talent_reports(talent_id: str, p: Principal = Depends(require_admin)):
    docs = await db.reports.find({"talent_id": talent_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return docs


@router.post("/admin/talents/{talent_id}/observations", response_model=Observation, status_code=201)
async def create_observation(talent_id: str, payload: ObservationCreate, p: Principal = Depends(require_admin)):
    talent = await db.talents.find_one({"id": talent_id})
    if not talent:
        raise HTTPException(status_code=404, detail="Talento não encontrado")

    obs = Observation(
        talent_id=talent_id,
        author_user_id=p.user.user_id if p.user else "admin",
        author_email=p.user.email if p.user else "admin",
        note=payload.note
    )
    await db.observations.insert_one(obs.model_dump())
    return obs


@router.get("/admin/talents/{talent_id}/observations", response_model=list[Observation])
async def get_talent_observations(talent_id: str, p: Principal = Depends(require_admin)):
    docs = await db.observations.find({"talent_id": talent_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return docs


@router.post("/activities/{activity_id}/register", status_code=201)
async def register_activity(activity_id: str, p: Principal = Depends(require_user), payload: dict = {}):
    """Only logged-in users can register. User info is auto-filled from session."""
    assert p.user
    
    # Find talent by activity_id
    talent = None
    async for t in db.talents.find({}, {"_id": 0}):
        activity = next((a for a in t.get("activities", []) if a["id"] == activity_id), None)
        if activity:
            talent = t
            break
    
    if not talent:
        raise HTTPException(status_code=404, detail="Atividade não encontrada.")
    
    talent_id = talent["id"]
    
    # Phone is required - talent owner needs it to contact participants
    user_phones = p.user.phones if hasattr(p.user, 'phones') else []
    if not user_phones:
        raise HTTPException(status_code=422, detail="Você precisa adicionar pelo menos um telefone em 'Meu perfil' antes de participar.")
    
    # Auto-fill from user session
    part = Participation(
        talent_id=talent_id,
        activity_id=activity_id,
        participant_name=p.user.name,
        participant_email=p.user.email,
        participant_phone=user_phones[0],
        participant_picture=p.user.picture,
        user_id=p.user.user_id,
    )
    
    # Fetch talent's gender and instagram from MongoDB to include in participation
    talent_gender = talent.get("gender")
    talent_instagram = talent.get("instagram", "")
    
    # Allow optional overrides from payload (participant's own info)
    if payload.get("participant_gender"):
        part.participant_gender = payload["participant_gender"]
    else:
        part.participant_gender = talent_gender  # Use talent's gender as default
    
    if payload.get("participant_instagram"):
        part.participant_instagram = payload["participant_instagram"].replace("@", "")
    elif talent_instagram:
        part.participant_instagram = talent_instagram.replace("@", "")  # Use talent's instagram as default
    
    await db.participations.insert_one(part.model_dump())
    return {"ok": True, "message": "Inscrição realizada com sucesso!"}


@router.get("/me/talents/{talent_id}/activities/{activity_id}/participants", response_model=list[Participation])
async def get_activity_participants(talent_id: str, activity_id: str, p: Principal = Depends(require_user)):
    assert p.user
    talent = await db.talents.find_one({"id": talent_id})
    if not talent:
        raise HTTPException(status_code=404, detail="Talento não encontrado.")

    # Verifica se o usuário é dono do talento ou admin
    if talent.get("owner_id") != p.user.user_id and not p.is_admin:
        raise HTTPException(status_code=403, detail="Acesso negado. Apenas o proprietário do talento pode ver os participantes.")

    docs = await db.participations.find({"talent_id": talent_id, "activity_id": activity_id}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return docs


class ParticipantActivity(BaseModel):
    activity_id: str
    activity_title: str
    participants: list[Participation]


@router.get("/me/talents/{talent_id}/participants", response_model=list[ParticipantActivity])
async def get_talent_participants(talent_id: str, p: Principal = Depends(require_user)):
    assert p.user
    talent = await db.talents.find_one({"id": talent_id}, {"_id": 0})
    if not talent:
        raise HTTPException(status_code=404, detail="Talento não encontrado.")

    # Verifica se o usuário é dono do talento ou admin
    if not p.is_admin and talent.get("owner_id") != p.user.user_id:
        raise HTTPException(status_code=403, detail="Acesso negado.")

    # Busca todas as participações do talento
    docs = await db.participations.find({"talent_id": talent_id}, {"_id": 0}).sort("created_at", -1).to_list(500)

    # Agrupa por atividade
    by_activity: dict[str, list[Participation]] = {}
    for d in docs:
        aid = d.get("activity_id", "")
        if aid not in by_activity:
            by_activity[aid] = []
        by_activity[aid].append(Participation(**d))

    # Monta a lista com os títulos das atividades
    result: list[ParticipantActivity] = []
    for activity in talent.get("activities", []):
        aid = activity.get("id", "")
        if aid in by_activity:
            result.append(ParticipantActivity(
                activity_id=aid,
                activity_title=activity.get("title", ""),
                participants=by_activity[aid],
            ))

    return result


@router.get("/admin/talents/{talent_id}/participants", response_model=list[ParticipantActivity])
async def get_admin_talent_participants(talent_id: str, p: Principal = Depends(require_admin)):
    """Admin endpoint to view all participants for a talent."""
    talent = await db.talents.find_one({"id": talent_id}, {"_id": 0})
    if not talent:
        raise HTTPException(status_code=404, detail="Talento não encontrado.")

    docs = await db.participations.find({"talent_id": talent_id}, {"_id": 0}).sort("created_at", -1).to_list(500)

    by_activity: dict[str, list[Participation]] = {}
    for d in docs:
        aid = d.get("activity_id", "")
        if aid not in by_activity:
            by_activity[aid] = []
        by_activity[aid].append(Participation(**d))

    result: list[ParticipantActivity] = []
    for activity in talent.get("activities", []):
        aid = activity.get("id", "")
        if aid in by_activity:
            result.append(ParticipantActivity(
                activity_id=aid,
                activity_title=activity.get("title", ""),
                participants=by_activity[aid],
            ))

    return result


# ---- public participants (aggregate counts only) ---------------------------
class PublicActivityParticipation(BaseModel):
    activity_id: str
    activity_title: str
    participant_count: int
    participants: list[Participation] = []  # Only populated for authenticated owners/admins


class PublicTalentParticipation(BaseModel):
    talent_id: str
    talent_name: str
    activities: list[PublicActivityParticipation]


@router.get("/participants", response_model=list[PublicTalentParticipation])
async def get_public_participants():
    """Public endpoint: shows participant counts per activity (no personal data)."""
    talents = await db.talents.find(APPROVED, {"_id": 0}).to_list(500)
    all_participants = await db.participations.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)

    result: list[PublicTalentParticipation] = []
    for talent in talents:
        talent_id = talent.get("id", "")
        talent_name = talent.get("name", "")
        activities = talent.get("activities", [])

        activity_counts: dict[str, int] = {}
        for p in all_participants:
            if p.get("talent_id") == talent_id:
                aid = p.get("activity_id", "")
                activity_counts[aid] = activity_counts.get(aid, 0) + 1

        talent_activities = [
            PublicActivityParticipation(
                activity_id=aid,
                activity_title=next((a.get("title", "") for a in activities if a.get("id") == aid), ""),
                participant_count=count,
            )
            for aid, count in activity_counts.items()
            if count > 0
        ]

        if talent_activities:
            result.append(PublicTalentParticipation(
                talent_id=talent_id,
                talent_name=talent_name,
                activities=talent_activities,
            ))

    return result


# ---- authenticated participants (full details for owners/admins) -------------
@router.get("/my-participants", response_model=list[PublicTalentParticipation])
async def get_my_participants(p: Principal = Depends(require_user)):
    """Returns participant details for talents owned by the logged-in user, with user phones."""
    assert p.user
    
    # Get user's talents
    user_talents = await db.talents.find({"owner_id": p.user.user_id}, {"_id": 0}).to_list(100)
    
    # Collect all unique participant user_ids to fetch their phones
    all_user_ids: set[str] = set()
    for talent in user_talents:
        talent_id = talent.get("id", "")
        all_parts = await db.participations.find({"talent_id": talent_id}, {"_id": 0}).to_list(500)
        for part in all_parts:
            uid = part.get("user_id")
            if uid:
                all_user_ids.add(uid)
    
    # Fetch user details (phones) for all participants
    user_details: dict[str, dict] = {}
    for uid in all_user_ids:
        doc = await db.users.find_one({"user_id": uid}, {"_id": 0})
        if doc:
            user_details[uid] = doc
    
    result: list[PublicTalentParticipation] = []
    for talent in user_talents:
        talent_id = talent.get("id", "")
        talent_name = talent.get("name", "")
        activities = talent.get("activities", [])
        
        # Get all participants for this talent
        all_parts = await db.participations.find({"talent_id": talent_id}, {"_id": 0}).sort("created_at", -1).to_list(500)
        
        # Enrich participants with user phones
        enriched_parts: list[dict] = []
        for part in all_parts:
            part_dict = dict(part)
            uid = part.get("user_id")
            if uid and uid in user_details:
                part_dict["participant_phones"] = user_details[uid].get("phones", [])
            else:
                part_dict["participant_phones"] = [part.get("participant_phone", "")] if part.get("participant_phone") else []
            enriched_parts.append(part_dict)
        
        # Group by activity
        by_activity: dict[str, list[dict]] = {}
        for part in enriched_parts:
            aid = part.get("activity_id", "")
            if aid not in by_activity:
                by_activity[aid] = []
            by_activity[aid].append(part)
        
        talent_activities = []
        for activity in activities:
            aid = activity.get("id", "")
            if aid in by_activity and len(by_activity[aid]) > 0:
                talent_activities.append(PublicActivityParticipation(
                    activity_id=aid,
                    activity_title=activity.get("title", ""),
                    participant_count=len(by_activity[aid]),
                    participants=[Participation(**p) for p in by_activity[aid]],
                ))
        
        if talent_activities:
            result.append(PublicTalentParticipation(
                talent_id=talent_id,
                talent_name=talent_name,
                activities=talent_activities,
            ))
    
    return result