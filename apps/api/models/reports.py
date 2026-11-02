import uuid
from datetime import datetime, timezone
from typing import Optional

from pydantic import BaseModel, Field


class Report(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    talent_id: str
    reporter_user_id: Optional[str] = None  # pode ser nulo para anônimo
    reporter_email: Optional[str] = None
    message: str = Field(min_length=3, max_length=2000)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ReportCreate(BaseModel):
    message: str = Field(min_length=3, max_length=2000)


class Observation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    talent_id: str
    author_user_id: str
    author_email: str
    note: str = Field(min_length=1, max_length=2000)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ObservationCreate(BaseModel):
    note: str = Field(min_length=1, max_length=2000)


class Participation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    talent_id: str
    activity_id: str
    participant_name: str = Field(min_length=2, max_length=120)
    participant_email: Optional[str] = None
    participant_phone: str = Field(default="", max_length=40)
    participant_picture: str = Field(default="", max_length=500)  # Google profile photo URL
    participant_gender: Optional[str] = None  # optional: mulher, homem, nao_binario, nao_informado
    participant_instagram: Optional[str] = None  # optional: @username
    user_id: Optional[str] = None  # linked user if authenticated
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
