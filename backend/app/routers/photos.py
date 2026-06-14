import os
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, Location, Photo
from ..schemas import PhotoResponse
from ..dependencies import get_current_user
from ..config import settings

router = APIRouter(prefix="/api/locations/{location_id}/photos", tags=["photos"])


@router.post("/", response_model=list[PhotoResponse], status_code=status.HTTP_201_CREATED)
def upload_photos(
    location_id: uuid.UUID,
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    loc = db.query(Location).filter(Location.id == location_id, Location.user_id == current_user.id).first()
    if not loc:
        raise HTTPException(status_code=404, detail="Location not found")

    os.makedirs(settings.upload_dir, exist_ok=True)
    photos = []
    for f in files:
        ext = os.path.splitext(f.filename or "img.jpg")[1]
        stored_name = f"{uuid.uuid4()}{ext}"
        path = os.path.join(settings.upload_dir, stored_name)
        with open(path, "wb") as out:
            content = f.file.read()
            out.write(content)
        photo = Photo(
            location_id=location_id,
            filename=stored_name,
            original_name=f.filename or "unknown",
        )
        db.add(photo)
        photos.append(photo)
    db.commit()
    for p in photos:
        db.refresh(p)
    return [PhotoResponse(
        id=p.id,
        location_id=p.location_id,
        filename=p.filename,
        original_name=p.original_name,
        uploaded_at=str(p.uploaded_at) if p.uploaded_at else None,
    ) for p in photos]


@router.get("/", response_model=list[PhotoResponse])
def list_photos(
    location_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    loc = db.query(Location).filter(Location.id == location_id, Location.user_id == current_user.id).first()
    if not loc:
        raise HTTPException(status_code=404, detail="Location not found")
    return [PhotoResponse(
        id=p.id,
        location_id=p.location_id,
        filename=p.filename,
        original_name=p.original_name,
        uploaded_at=str(p.uploaded_at) if p.uploaded_at else None,
    ) for p in loc.photos]


@router.get("/{photo_id}/file")
def get_photo_file(
    location_id: uuid.UUID,
    photo_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    photo = db.query(Photo).join(Location).filter(
        Photo.id == photo_id,
        Location.id == location_id,
        Location.user_id == current_user.id,
    ).first()
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    path = os.path.join(settings.upload_dir, photo.filename)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(path)


@router.delete("/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_photo(
    location_id: uuid.UUID,
    photo_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    photo = db.query(Photo).join(Location).filter(
        Photo.id == photo_id,
        Location.id == location_id,
        Location.user_id == current_user.id,
    ).first()
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    path = os.path.join(settings.upload_dir, photo.filename)
    if os.path.exists(path):
        os.remove(path)
    db.delete(photo)
    db.commit()
