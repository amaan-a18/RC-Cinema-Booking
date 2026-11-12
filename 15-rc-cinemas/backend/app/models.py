import enum
from datetime import datetime

from sqlalchemy import (
    DateTime,
    Enum as SAEnum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def utcnow() -> datetime:
    return datetime.utcnow()


class UserRole(str, enum.Enum):
    user = "user"
    admin = "admin"


class SeatTier(str, enum.Enum):
    classic = "classic"
    premium = "premium"
    recliner = "recliner"


class ShowFormat(str, enum.Enum):
    two_d = "2D"
    three_d = "3D"
    dolby_atmos = "Dolby Atmos"
    four_dx = "4DX"


class BookingStatus(str, enum.Enum):
    confirmed = "confirmed"
    cancelled = "cancelled"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(SAEnum(UserRole), default=UserRole.user, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    bookings = relationship("Booking", back_populates="user")


class Screen(Base):
    __tablename__ = "screens"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    rows: Mapped[int] = mapped_column(Integer, nullable=False)
    cols: Mapped[int] = mapped_column(Integer, nullable=False)

    seats = relationship("Seat", back_populates="screen", cascade="all, delete-orphan")
    shows = relationship("Show", back_populates="screen")


class Seat(Base):
    __tablename__ = "seats"
    __table_args__ = (UniqueConstraint("screen_id", "row_label", "col_number", name="uq_seat_position"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    screen_id: Mapped[int] = mapped_column(ForeignKey("screens.id"), nullable=False)
    row_label: Mapped[str] = mapped_column(String(4), nullable=False)
    col_number: Mapped[int] = mapped_column(Integer, nullable=False)
    label: Mapped[str] = mapped_column(String(10), nullable=False)
    tier: Mapped[SeatTier] = mapped_column(SAEnum(SeatTier), default=SeatTier.classic, nullable=False)

    screen = relationship("Screen", back_populates="seats")


class Movie(Base):
    __tablename__ = "movies"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    synopsis: Mapped[str] = mapped_column(Text, default="")
    genre: Mapped[str] = mapped_column(String(255), default="")
    language: Mapped[str] = mapped_column(String(100), default="")
    duration_minutes: Mapped[int] = mapped_column(Integer, default=120)
    cert: Mapped[str] = mapped_column(String(20), default="UA")
    trailer_youtube_id: Mapped[str] = mapped_column(String(32), default="")
    poster_url: Mapped[str] = mapped_column(String(500), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    shows = relationship("Show", back_populates="movie", cascade="all, delete-orphan")


class Show(Base):
    __tablename__ = "shows"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    movie_id: Mapped[int] = mapped_column(ForeignKey("movies.id"), nullable=False)
    screen_id: Mapped[int] = mapped_column(ForeignKey("screens.id"), nullable=False)
    format: Mapped[ShowFormat] = mapped_column(SAEnum(ShowFormat), nullable=False)
    start_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    price_classic: Mapped[float] = mapped_column(Float, nullable=False, default=180.0)
    price_premium: Mapped[float] = mapped_column(Float, nullable=False, default=260.0)
    price_recliner: Mapped[float] = mapped_column(Float, nullable=False, default=360.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    def price_for_tier(self, tier: "SeatTier") -> float:
        return {
            SeatTier.classic: self.price_classic,
            SeatTier.premium: self.price_premium,
            SeatTier.recliner: self.price_recliner,
        }[tier]

    movie = relationship("Movie", back_populates="shows")
    screen = relationship("Screen", back_populates="shows")
    bookings = relationship("Booking", back_populates="show", cascade="all, delete-orphan")


class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    show_id: Mapped[int] = mapped_column(ForeignKey("shows.id"), nullable=False)
    total_amount: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[BookingStatus] = mapped_column(SAEnum(BookingStatus), default=BookingStatus.confirmed)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    user = relationship("User", back_populates="bookings")
    show = relationship("Show", back_populates="bookings")
    seats = relationship("BookingSeat", back_populates="booking", cascade="all, delete-orphan")


class BookingSeat(Base):
    __tablename__ = "booking_seats"
    __table_args__ = (UniqueConstraint("show_id", "seat_id", name="uq_show_seat"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    booking_id: Mapped[int] = mapped_column(ForeignKey("bookings.id"), nullable=False)
    show_id: Mapped[int] = mapped_column(ForeignKey("shows.id"), nullable=False)
    seat_id: Mapped[int] = mapped_column(ForeignKey("seats.id"), nullable=False)

    booking = relationship("Booking", back_populates="seats")
    seat = relationship("Seat")
