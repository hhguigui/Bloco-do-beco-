import uuid
from datetime import datetime, timezone
from typing import Literal, Optional

from pydantic import BaseModel, Field

Category = Literal["musica", "costura", "artesanato", "artes_visuais", "danca_teatro", "gastronomia", "outros"]
Gender = Literal["mulher", "homem", "nao_binario", "nao_informado"]
AgeRange = Literal["15-24", "25-34", "35-49", "50-64", "65+"]
Experience = Literal["<2", "2-5", "5-10", "10-20", "20+"]
ActivityType = Literal["oficina", "aula", "servico", "evento"]
TalentStatus = Literal["pending", "approved", "rejected"]

CATEGORIES = ["musica", "costura", "artesanato", "artes_visuais", "danca_teatro", "gastronomia", "outros"]
GENDERS = ["mulher", "homem", "nao_binario", "nao_informado"]
AGE_RANGES = ["15-24", "25-34", "35-49", "50-64", "65+"]
EXPERIENCES = ["<2", "2-5", "5-10", "10-20", "20+"]
ACTIVITY_TYPES = ["oficina", "aula", "servico", "evento"]


class Activity(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str = Field(min_length=2, max_length=120)
    type: ActivityType
    description: str = Field(default="", max_length=1000)
    date: Optional[str] = Field(default=None, pattern=r"^\d{4}-\d{2}-\d{2}$")  # one-off date (YYYY-MM-DD); None = recurring
    schedule: str = Field(default="", max_length=200)
    price: str = Field(default="Gratuito", max_length=80)


class TalentInput(BaseModel):
    """Client-writable fields only — status/owner are stamped server-side (no mass assignment)."""

    name: str = Field(min_length=2, max_length=120)
    category: Category
    specialty: str = Field(default="", max_length=120)
    bio: str = Field(default="", max_length=3000)
    gender: Gender = "nao_informado"
    age_range: AgeRange
    experience: Experience
    address: str = Field(min_length=3, max_length=200)
    lat: Optional[float] = None
    lng: Optional[float] = None
    phone: str = Field(default="", max_length=40)
    instagram: str = Field(default="", max_length=80)
    photo: str = Field(default="", max_length=1_500_000)  # URL or data: URL (resized client-side)
    activities: list[Activity] = Field(default_factory=list)


class Talent(TalentInput):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    lat: float
    lng: float
    status: TalentStatus = "pending"
    owner_id: Optional[str] = None
    owner_email: str = ""  # only returned to admins
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class StatusUpdate(BaseModel):
    status: TalentStatus


class ActivityListing(Activity):
    talent_id: str
    talent_name: str
    talent_category: Category
    talent_photo: str
    address: str
    phone: str
    instagram: str


class CountItem(BaseModel):
    key: str
    count: int


class Summary(BaseModel):
    total_talents: int
    total_activities: int
    free_activities: int
    by_category: list[CountItem]


class Stats(Summary):
    pending_talents: int
    by_gender: list[CountItem]
    by_age: list[CountItem]
    by_experience: list[CountItem]
    by_activity_type: list[CountItem]


class TodayResponse(BaseModel):
    today: str
