from datetime import datetime, time, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from .. import schemas
from ..database import get_db
from ..deps import require_admin
from ..models import Booking, BookingSeat, BookingStatus, Movie, Screen, Seat, Show, User

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/overview", response_model=schemas.AdminOverview)
def get_overview(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    now = datetime.utcnow()
    today_start = datetime.combine(now.date(), time.min)
    today_end = today_start + timedelta(days=1)

    total_movies = db.query(func.count(Movie.id)).scalar() or 0
    total_screens = db.query(func.count(Screen.id)).scalar() or 0
    total_seats = db.query(func.count(Seat.id)).scalar() or 0
    total_shows = db.query(func.count(Show.id)).scalar() or 0
    shows_today = (
        db.query(func.count(Show.id))
        .filter(Show.start_time >= today_start, Show.start_time < today_end)
        .scalar()
        or 0
    )
    upcoming_shows = db.query(func.count(Show.id)).filter(Show.start_time >= now).scalar() or 0

    confirmed = Booking.status == BookingStatus.confirmed
    total_bookings = db.query(func.count(Booking.id)).filter(confirmed).scalar() or 0
    seats_booked = (
        db.query(func.count(BookingSeat.id))
        .join(Booking, Booking.id == BookingSeat.booking_id)
        .filter(confirmed)
        .scalar()
        or 0
    )
    total_revenue = db.query(func.coalesce(func.sum(Booking.total_amount), 0.0)).filter(confirmed).scalar() or 0.0
    revenue_today = (
        db.query(func.coalesce(func.sum(Booking.total_amount), 0.0))
        .filter(confirmed, Booking.created_at >= today_start, Booking.created_at < today_end)
        .scalar()
        or 0.0
    )

    upcoming = (
        db.query(Show)
        .filter(Show.start_time >= now)
        .order_by(Show.start_time)
        .limit(6)
        .all()
    )

    recent = (
        db.query(Booking)
        .filter(confirmed)
        .order_by(Booking.created_at.desc())
        .limit(8)
        .all()
    )
    recent_bookings = [
        schemas.AdminBookingSummary(
            id=b.id,
            movie_title=b.show.movie.title,
            screen_name=b.show.screen.name,
            user_name=b.user.full_name,
            seat_labels=sorted(bs.seat.label for bs in b.seats),
            total_amount=b.total_amount,
            created_at=b.created_at,
        )
        for b in recent
    ]

    return schemas.AdminOverview(
        total_movies=total_movies,
        total_screens=total_screens,
        total_seats=total_seats,
        total_shows=total_shows,
        shows_today=shows_today,
        upcoming_shows=upcoming_shows,
        total_bookings=total_bookings,
        seats_booked=seats_booked,
        total_revenue=total_revenue,
        revenue_today=revenue_today,
        upcoming=upcoming,
        recent_bookings=recent_bookings,
    )
