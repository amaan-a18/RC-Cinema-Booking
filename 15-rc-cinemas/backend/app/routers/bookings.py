from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .. import schemas
from ..database import get_db
from ..deps import get_current_user
from ..models import Booking, BookingSeat, Seat, Show, User, UserRole

router = APIRouter(tags=["bookings"])


def _booking_to_out(booking: Booking) -> schemas.BookingOut:
    return schemas.BookingOut(
        id=booking.id,
        show_id=booking.show_id,
        total_amount=booking.total_amount,
        status=booking.status,
        created_at=booking.created_at,
        show=booking.show,
        seat_labels=sorted(bs.seat.label for bs in booking.seats),
    )


@router.get("/api/shows/{show_id}/seats", response_model=schemas.SeatMapOut)
def get_seat_map(show_id: int, db: Session = Depends(get_db)):
    show = db.get(Show, show_id)
    if not show:
        raise HTTPException(status_code=404, detail="Show not found")

    seats = db.query(Seat).filter(Seat.screen_id == show.screen_id).order_by(Seat.row_label, Seat.col_number).all()
    taken_seat_ids = {
        bs.seat_id
        for bs in db.query(BookingSeat).filter(BookingSeat.show_id == show_id).all()
    }

    return schemas.SeatMapOut(
        show_id=show_id,
        rows=show.screen.rows,
        cols=show.screen.cols,
        seats=[
            schemas.SeatMapEntry(
                id=s.id,
                row_label=s.row_label,
                col_number=s.col_number,
                label=s.label,
                tier=s.tier,
                taken=s.id in taken_seat_ids,
            )
            for s in seats
        ],
    )


@router.post("/api/bookings", response_model=schemas.BookingOut, status_code=201)
def create_booking(
    payload: schemas.BookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == UserRole.admin:
        raise HTTPException(status_code=403, detail="Admin accounts cannot book tickets")

    show = db.get(Show, payload.show_id)
    if not show:
        raise HTTPException(status_code=404, detail="Show not found")

    seat_ids = set(payload.seat_ids)
    seats = db.query(Seat).filter(Seat.id.in_(seat_ids), Seat.screen_id == show.screen_id).all()
    if len(seats) != len(seat_ids):
        raise HTTPException(status_code=400, detail="One or more seats do not belong to this show's screen")

    already_taken = {
        bs.seat_id
        for bs in db.query(BookingSeat).filter(
            BookingSeat.show_id == show.id, BookingSeat.seat_id.in_(seat_ids)
        ).all()
    }
    if already_taken:
        raise HTTPException(status_code=409, detail="One or more selected seats were just booked by someone else")

    total_amount = sum(show.price_for_tier(seat.tier) for seat in seats)
    booking = Booking(
        user_id=current_user.id,
        show_id=show.id,
        total_amount=total_amount,
    )
    db.add(booking)
    db.flush()

    for seat_id in seat_ids:
        db.add(BookingSeat(booking_id=booking.id, show_id=show.id, seat_id=seat_id))

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="One or more selected seats were just booked by someone else")

    db.refresh(booking)
    return _booking_to_out(booking)


@router.get("/api/bookings", response_model=list[schemas.BookingOut])
def list_my_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    bookings = (
        db.query(Booking)
        .filter(Booking.user_id == current_user.id)
        .order_by(Booking.created_at.desc())
        .all()
    )
    return [_booking_to_out(b) for b in bookings]


@router.get("/api/bookings/{booking_id}", response_model=schemas.BookingOut)
def get_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    booking = db.get(Booking, booking_id)
    if not booking or booking.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Booking not found")
    return _booking_to_out(booking)
