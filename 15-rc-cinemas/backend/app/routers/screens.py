from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import schemas
from ..database import get_db
from ..deps import require_admin
from ..models import Screen, Seat, Show, User
from ..seating import generate_seats

router = APIRouter(prefix="/api/screens", tags=["screens"])


@router.get("", response_model=list[schemas.ScreenOut])
def list_screens(db: Session = Depends(get_db)):
    return db.query(Screen).order_by(Screen.id).all()


@router.post("", response_model=schemas.ScreenOut, status_code=201)
def create_screen(
    payload: schemas.ScreenCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    screen = Screen(name=payload.name, rows=payload.rows, cols=payload.cols)
    db.add(screen)
    db.flush()
    generate_seats(db, screen)
    db.commit()
    db.refresh(screen)
    return screen


@router.patch("/{screen_id}", response_model=schemas.ScreenOut)
def update_screen(
    screen_id: int,
    payload: schemas.ScreenUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    screen = db.get(Screen, screen_id)
    if not screen:
        raise HTTPException(status_code=404, detail="Screen not found")
    if payload.name is not None:
        screen.name = payload.name
    db.commit()
    db.refresh(screen)
    return screen


@router.get("/{screen_id}/seats", response_model=list[schemas.SeatOut])
def list_screen_seats(
    screen_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    screen = db.get(Screen, screen_id)
    if not screen:
        raise HTTPException(status_code=404, detail="Screen not found")
    return (
        db.query(Seat)
        .filter(Seat.screen_id == screen_id)
        .order_by(Seat.row_label, Seat.col_number)
        .all()
    )


@router.delete("/{screen_id}", status_code=204)
def delete_screen(
    screen_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    screen = db.get(Screen, screen_id)
    if not screen:
        raise HTTPException(status_code=404, detail="Screen not found")
    has_shows = db.query(Show).filter(Show.screen_id == screen_id).first() is not None
    if has_shows:
        raise HTTPException(status_code=409, detail="Cannot delete a screen that has shows scheduled on it")
    db.delete(screen)
    db.commit()
    return None
