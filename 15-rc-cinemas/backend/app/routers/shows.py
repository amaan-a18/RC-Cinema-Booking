from datetime import date, datetime, time, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import schemas
from ..database import get_db
from ..deps import require_admin
from ..models import Booking, Movie, Screen, Show, User

router = APIRouter(prefix="/api/shows", tags=["shows"])


@router.get("", response_model=list[schemas.ShowOut])
def list_shows(
    movie_id: int | None = None,
    show_date: date | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(Show)
    if movie_id is not None:
        query = query.filter(Show.movie_id == movie_id)
    if show_date is not None:
        start = datetime.combine(show_date, time.min)
        end = start + timedelta(days=1)
        query = query.filter(Show.start_time >= start, Show.start_time < end)
    return query.order_by(Show.start_time).all()


@router.get("/{show_id}", response_model=schemas.ShowOut)
def get_show(show_id: int, db: Session = Depends(get_db)):
    show = db.get(Show, show_id)
    if not show:
        raise HTTPException(status_code=404, detail="Show not found")
    return show


@router.post("", response_model=schemas.ShowOut, status_code=201)
def create_show(
    payload: schemas.ShowCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    if not db.get(Movie, payload.movie_id):
        raise HTTPException(status_code=404, detail="Movie not found")
    if not db.get(Screen, payload.screen_id):
        raise HTTPException(status_code=404, detail="Screen not found")

    show = Show(**payload.model_dump())
    db.add(show)
    db.commit()
    db.refresh(show)
    return show


@router.post("/bulk", response_model=list[schemas.ShowOut], status_code=201)
def bulk_create_shows(
    payload: schemas.ShowBulkCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    if not db.get(Movie, payload.movie_id):
        raise HTTPException(status_code=404, detail="Movie not found")
    if not db.get(Screen, payload.screen_id):
        raise HTTPException(status_code=404, detail="Screen not found")
    if payload.end_date < payload.start_date:
        raise HTTPException(status_code=400, detail="End date must be on or after the start date")
    if (payload.end_date - payload.start_date).days > 90:
        raise HTTPException(status_code=400, detail="Date range is too large (max 90 days)")
    if not set(payload.days_of_week) <= set(range(7)):
        raise HTTPException(status_code=400, detail="days_of_week must be 0 (Monday) through 6 (Sunday)")

    hour, minute = (int(part) for part in payload.time_of_day.split(":"))
    days = set(payload.days_of_week)

    created: list[Show] = []
    current = payload.start_date
    while current <= payload.end_date:
        if current.weekday() in days:
            created.append(
                Show(
                    movie_id=payload.movie_id,
                    screen_id=payload.screen_id,
                    format=payload.format,
                    start_time=datetime.combine(current, time(hour, minute)),
                    price_classic=payload.price_classic,
                    price_premium=payload.price_premium,
                    price_recliner=payload.price_recliner,
                )
            )
        current += timedelta(days=1)

    if not created:
        raise HTTPException(status_code=400, detail="No dates in range match the selected days of week")

    db.add_all(created)
    db.commit()
    for show in created:
        db.refresh(show)
    return created


@router.patch("/{show_id}", response_model=schemas.ShowOut)
def update_show(
    show_id: int,
    payload: schemas.ShowUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    show = db.get(Show, show_id)
    if not show:
        raise HTTPException(status_code=404, detail="Show not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(show, field, value)
    db.commit()
    db.refresh(show)
    return show


@router.delete("/{show_id}", status_code=204)
def delete_show(
    show_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    show = db.get(Show, show_id)
    if not show:
        raise HTTPException(status_code=404, detail="Show not found")
    has_bookings = db.query(Booking).filter(Booking.show_id == show_id).first() is not None
    if has_bookings:
        raise HTTPException(status_code=409, detail="Cannot delete a show that already has bookings")
    db.delete(show)
    db.commit()
    return None
