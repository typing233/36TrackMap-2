from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from geoalchemy2.functions import ST_X, ST_Y, ST_AsText
from geoalchemy2.shape import from_shape
from shapely.geometry import Point

from ..database import get_db
from ..models import User, Location, Tag, location_tags
from ..schemas import LocationCreate, LocationUpdate, LocationResponse, TagResponse, PhotoResponse
from ..dependencies import get_current_user

router = APIRouter(prefix="/api/locations", tags=["locations"])


def location_to_response(loc: Location) -> LocationResponse:
    point = loc.coordinates
    from geoalchemy2.shape import to_shape
    shape = to_shape(point)
    return LocationResponse(
        id=loc.id,
        name=loc.name,
        description=loc.description or "",
        lat=shape.y,
        lng=shape.x,
        start_date=loc.start_date,
        end_date=loc.end_date,
        rating=loc.rating,
        visit_status=loc.visit_status,
        tags=[TagResponse(id=t.id, name=t.name) for t in loc.tags],
        photos=[PhotoResponse(
            id=p.id,
            location_id=p.location_id,
            filename=p.filename,
            original_name=p.original_name,
            uploaded_at=str(p.uploaded_at) if p.uploaded_at else None,
        ) for p in loc.photos],
        created_at=str(loc.created_at) if loc.created_at else None,
        updated_at=str(loc.updated_at) if loc.updated_at else None,
    )


def get_or_create_tags(db: Session, user_id: UUID, tag_names: list[str]) -> list[Tag]:
    tags = []
    for name in tag_names:
        name = name.strip()
        if not name:
            continue
        tag = db.query(Tag).filter(Tag.user_id == user_id, Tag.name == name).first()
        if not tag:
            tag = Tag(user_id=user_id, name=name)
            db.add(tag)
            db.flush()
        tags.append(tag)
    return tags


@router.get("/", response_model=list[LocationResponse])
def list_locations(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Location).filter(Location.user_id == current_user.id)
    if status and status in ("visited", "planned"):
        query = query.filter(Location.visit_status == status)
    locations = query.order_by(Location.created_at.desc()).all()
    return [location_to_response(loc) for loc in locations]


@router.get("/{location_id}", response_model=LocationResponse)
def get_location(
    location_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    loc = db.query(Location).filter(Location.id == location_id, Location.user_id == current_user.id).first()
    if not loc:
        raise HTTPException(status_code=404, detail="Location not found")
    return location_to_response(loc)


@router.post("/", response_model=LocationResponse, status_code=status.HTTP_201_CREATED)
def create_location(
    data: LocationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    point = from_shape(Point(data.lng, data.lat), srid=4326)
    loc = Location(
        user_id=current_user.id,
        name=data.name,
        description=data.description,
        coordinates=point,
        start_date=data.start_date,
        end_date=data.end_date,
        rating=data.rating,
        visit_status=data.visit_status,
    )
    if data.tags:
        loc.tags = get_or_create_tags(db, current_user.id, data.tags)
    db.add(loc)
    db.commit()
    db.refresh(loc)
    return location_to_response(loc)


@router.put("/{location_id}", response_model=LocationResponse)
def update_location(
    location_id: UUID,
    data: LocationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    loc = db.query(Location).filter(Location.id == location_id, Location.user_id == current_user.id).first()
    if not loc:
        raise HTTPException(status_code=404, detail="Location not found")
    if data.name is not None:
        loc.name = data.name
    if data.description is not None:
        loc.description = data.description
    if data.start_date is not None:
        loc.start_date = data.start_date
    if data.end_date is not None:
        loc.end_date = data.end_date
    if data.rating is not None:
        loc.rating = data.rating
    if data.visit_status is not None:
        loc.visit_status = data.visit_status
    if data.tags is not None:
        loc.tags = get_or_create_tags(db, current_user.id, data.tags)
    db.commit()
    db.refresh(loc)
    return location_to_response(loc)


@router.delete("/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_location(
    location_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    loc = db.query(Location).filter(Location.id == location_id, Location.user_id == current_user.id).first()
    if not loc:
        raise HTTPException(status_code=404, detail="Location not found")
    import os
    from ..config import settings
    for photo in loc.photos:
        path = os.path.join(settings.upload_dir, photo.filename)
        if os.path.exists(path):
            os.remove(path)
    db.delete(loc)
    db.commit()
