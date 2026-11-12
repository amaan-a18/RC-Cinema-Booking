from datetime import date, datetime

from pydantic import BaseModel, EmailStr, Field

from .models import BookingStatus, SeatTier, ShowFormat, UserRole


# ---- auth / users ----

class RegisterRequest(BaseModel):
    email: EmailStr
    full_name: str
    password: str = Field(min_length=6)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: UserRole

    class Config:
        from_attributes = True


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---- screens / seats ----

class ScreenCreate(BaseModel):
    name: str
    rows: int = Field(gt=0, le=26)
    cols: int = Field(gt=0, le=40)


class ScreenUpdate(BaseModel):
    name: str | None = None


class SeatOut(BaseModel):
    id: int
    row_label: str
    col_number: int
    label: str
    tier: SeatTier

    class Config:
        from_attributes = True


class ScreenOut(BaseModel):
    id: int
    name: str
    rows: int
    cols: int

    class Config:
        from_attributes = True


# ---- movies ----

class MovieCreate(BaseModel):
    title: str
    synopsis: str = ""
    genre: str = ""
    language: str = ""
    duration_minutes: int = 120
    cert: str = "UA"
    trailer_youtube_id: str = ""
    poster_url: str = ""


class MovieUpdate(BaseModel):
    title: str | None = None
    synopsis: str | None = None
    genre: str | None = None
    language: str | None = None
    duration_minutes: int | None = None
    cert: str | None = None
    trailer_youtube_id: str | None = None
    poster_url: str | None = None


class MovieOut(BaseModel):
    id: int
    title: str
    synopsis: str
    genre: str
    language: str
    duration_minutes: int
    cert: str
    trailer_youtube_id: str
    poster_url: str

    class Config:
        from_attributes = True


# ---- shows ----

class ShowCreate(BaseModel):
    movie_id: int
    screen_id: int
    format: ShowFormat
    start_time: datetime
    price_classic: float = 180.0
    price_premium: float = 260.0
    price_recliner: float = 360.0


class ShowBulkCreate(BaseModel):
    movie_id: int
    screen_id: int
    format: ShowFormat
    time_of_day: str = Field(pattern=r"^([01]\d|2[0-3]):[0-5]\d$")  # "HH:MM"
    start_date: date
    end_date: date
    days_of_week: list[int] = Field(min_length=1)  # Monday=0 .. Sunday=6
    price_classic: float = 180.0
    price_premium: float = 260.0
    price_recliner: float = 360.0


class ShowUpdate(BaseModel):
    format: ShowFormat | None = None
    start_time: datetime | None = None
    price_classic: float | None = None
    price_premium: float | None = None
    price_recliner: float | None = None


class ShowOut(BaseModel):
    id: int
    movie_id: int
    screen_id: int
    format: ShowFormat
    start_time: datetime
    price_classic: float
    price_premium: float
    price_recliner: float
    movie: MovieOut
    screen: ScreenOut

    class Config:
        from_attributes = True


# ---- seat map / bookings ----

class SeatMapEntry(BaseModel):
    id: int
    row_label: str
    col_number: int
    label: str
    tier: SeatTier
    taken: bool


class SeatMapOut(BaseModel):
    show_id: int
    rows: int
    cols: int
    seats: list[SeatMapEntry]


class BookingCreate(BaseModel):
    show_id: int
    seat_ids: list[int] = Field(min_length=1)


class BookingOut(BaseModel):
    id: int
    show_id: int
    total_amount: float
    status: BookingStatus
    created_at: datetime
    show: ShowOut
    seat_labels: list[str]

    class Config:
        from_attributes = True


# ---- admin dashboard ----

class AdminBookingSummary(BaseModel):
    id: int
    movie_title: str
    screen_name: str
    user_name: str
    seat_labels: list[str]
    total_amount: float
    created_at: datetime


class AdminOverview(BaseModel):
    total_movies: int
    total_screens: int
    total_seats: int
    total_shows: int
    shows_today: int
    upcoming_shows: int
    total_bookings: int
    seats_booked: int
    total_revenue: float
    revenue_today: float
    upcoming: list[ShowOut]
    recent_bookings: list[AdminBookingSummary]
