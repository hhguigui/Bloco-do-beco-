from pydantic import BaseModel, Field


class RecommendRequest(BaseModel):
    query: str = Field(min_length=3, max_length=500)


class BioRequest(BaseModel):
    name: str = Field(default="", max_length=120)
    category: str = Field(default="", max_length=40)
    specialty: str = Field(default="", max_length=120)
    notes: str = Field(min_length=3, max_length=1500)
