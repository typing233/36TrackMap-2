from datetime import date
from enum import Enum
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, field_validator


class UserCreate(BaseModel):
    username: str
    email: str
    password: str


class UserResponse(BaseModel):
    id: UUID
    username: str
    email: str

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LocationCreate(BaseModel):
    name: str
    lat: float
    lng: float
    description: str = ""
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    rating: Optional[int] = None
    visit_status: Literal["visited", "planned"] = "planned"
    tags: list[str] = []

    @field_validator("rating")
    @classmethod
    def rating_range(cls, v):
        if v is not None and (v < 1 or v > 5):
            raise ValueError("rating must be between 1 and 5")
        return v


class LocationUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    rating: Optional[int] = None
    visit_status: Optional[Literal["visited", "planned"]] = None
    tags: Optional[list[str]] = None

    @field_validator("rating")
    @classmethod
    def rating_range(cls, v):
        if v is not None and (v < 1 or v > 5):
            raise ValueError("rating must be between 1 and 5")
        return v


class TagResponse(BaseModel):
    id: UUID
    name: str

    class Config:
        from_attributes = True


class PhotoResponse(BaseModel):
    id: UUID
    location_id: UUID
    filename: str
    original_name: str
    uploaded_at: Optional[str] = None

    class Config:
        from_attributes = True


class LocationResponse(BaseModel):
    id: UUID
    name: str
    description: str
    lat: float
    lng: float
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    rating: Optional[int] = None
    visit_status: str
    tags: list[TagResponse] = []
    photos: list[PhotoResponse] = []
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True
