"""
Seed script: creates tables (if missing) and loads demo data for RC Cinemas --
one admin account, 3 screens with generated seat layouts, 8 demo movies (real
public YouTube trailer ids), and a spread of shows across screens/formats/times
today and tomorrow so the booking flow has something to click through
immediately.

Run from the backend/ directory:
    python -m app.seed
"""
import random
import sys
from datetime import datetime, timedelta

from .database import Base, SessionLocal, engine
from .models import Booking, BookingSeat, Movie, Screen, Seat, Show, ShowFormat, User, UserRole
from .seating import generate_seats
from .security import hash_password

SEED_ADMIN_EMAIL = "admin@rccinemas.com"
SEED_DEMO_EMAIL = "demo@rccinemas.com"
SEED_PASSWORD = "password123"


def build_admin(db):
    admin = User(
        email=SEED_ADMIN_EMAIL,
        full_name="RC Cinemas Admin",
        role=UserRole.admin,
        hashed_password=hash_password(SEED_PASSWORD),
    )
    db.add(admin)
    db.flush()
    return admin


def build_demo_user(db):
    user = User(
        email=SEED_DEMO_EMAIL,
        full_name="Demo Patron",
        role=UserRole.user,
        hashed_password=hash_password(SEED_PASSWORD),
    )
    db.add(user)
    db.flush()
    return user


def build_screens(db):
    screens_data = [
        dict(name="Audi 1", rows=8, cols=12),
        dict(name="Audi 2", rows=6, cols=10),
        dict(name="Audi 3 - Grand", rows=10, cols=14),
    ]
    screens = []
    for s in screens_data:
        screen = Screen(**s)
        db.add(screen)
        db.flush()
        generate_seats(db, screen)
        screens.append(screen)
    db.flush()
    return screens


def build_movies(db):
    # Trailer IDs and poster images below were looked up against the real films
    # and each trailer was verified to actually play when embedded (many official
    # studio uploads of Indian theatrical trailers disable embedding outright --
    # these are the ones confirmed to work).
    movies_data = [
        dict(title="RRR", synopsis="Two legendary revolutionaries, one unforgettable fight for freedom.",
             genre="Action / Drama", language="Telugu", duration_minutes=187, cert="UA",
             trailer_youtube_id="f_vbAtFSEc0",
             poster_url="https://image.tmdb.org/t/p/w500/tjpiEnZBUAA8pdNPRKa5vP2Zpqw.jpg"),
        dict(title="Jailer 2", synopsis="A retired jailer is pulled back for one last, personal fight.",
             genre="Action / Thriller", language="Tamil", duration_minutes=166, cert="UA 16+",
             trailer_youtube_id="FW_PPcr1sPE",
             poster_url="https://image.tmdb.org/t/p/w500/8tBeCATNGryuWW1eOeNfiUAEn4P.jpg"),
        dict(title="Kantara: Chapter 1", synopsis="A mythic tale of land, faith and the forest spirit that guards it.",
             genre="Mythology / Action", language="Kannada", duration_minutes=176, cert="U",
             trailer_youtube_id="M2OnifMgvps",
             poster_url="https://image.tmdb.org/t/p/w500/hmprmTW6bwlYLNlNOICYrkXOr0e.jpg"),
        dict(title="KGF: Chapter 2", synopsis="Rocky's rule over the Kolar Gold Fields faces its biggest threat yet.",
             genre="Action / Period", language="Kannada", duration_minutes=143, cert="UA",
             trailer_youtube_id="JKa05nyUmuQ",
             poster_url="https://image.tmdb.org/t/p/w500/khNVygolU0TxLIDWff5tQlAhZ23.jpg"),
        dict(title="Pushpa 2: The Rule", synopsis="Pushpa Raj's empire grows -- and so does the heat on his trail.",
             genre="Action / Drama", language="Telugu", duration_minutes=200, cert="UA",
             trailer_youtube_id="g3JUbgOHgdw",
             poster_url="https://image.tmdb.org/t/p/w500/xkYGdKuK8jfqvGNCZV1uNdYkIfS.jpg"),
        dict(title="Baahubali 2: The Conclusion", synopsis="The question everyone asked, finally answered: why did Kattappa kill Baahubali?",
             genre="Epic / Action", language="Telugu", duration_minutes=167, cert="UA",
             trailer_youtube_id="G62HrubdD6o",
             poster_url="https://image.tmdb.org/t/p/w500/sXf30F2HFpsFPXlNz7jpOySSV9I.jpg"),
        dict(title="Salaar: Part 1 - Ceasefire", synopsis="A fragile truce between two warlords is about to shatter.",
             genre="Action / Thriller", language="Telugu", duration_minutes=175, cert="UA",
             trailer_youtube_id="4GPvYMKtrtI",
             poster_url="https://image.tmdb.org/t/p/w500/8tupYwl5FBD2LjsqdgisLHlonn0.jpg"),
        dict(title="Leo", synopsis="A quiet cafe owner's violent past comes looking for him.",
             genre="Action / Thriller", language="Tamil", duration_minutes=164, cert="UA 13+",
             trailer_youtube_id="Po3jStA673E",
             poster_url="https://image.tmdb.org/t/p/w500/sv1BmbzF9MLVVREPU4jQBMxBl4e.jpg"),
    ]
    movies = []
    for m in movies_data:
        movie = Movie(**m)
        db.add(movie)
        movies.append(movie)
    db.flush()
    return movies


# Base (classic-tier) price by format; premium and recliner scale up from there.
FORMAT_BASE_PRICE = {
    ShowFormat.two_d: 150.0,
    ShowFormat.three_d: 220.0,
    ShowFormat.dolby_atmos: 260.0,
    ShowFormat.four_dx: 300.0,
}
PREMIUM_MULTIPLIER = 1.35
RECLINER_MULTIPLIER = 1.9


def build_shows(db, movies, screens):
    times = [(10, 0), (14, 0), (18, 0), (21, 30)]
    formats = [ShowFormat.two_d, ShowFormat.three_d, ShowFormat.dolby_atmos, ShowFormat.four_dx]
    base_day = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

    shows = []
    for mi, movie in enumerate(movies):
        for day_offset in (0, 1):
            for si in range(2):
                screen = screens[(mi + si) % len(screens)]
                hour, minute = times[(mi + si + day_offset) % len(times)]
                fmt = formats[(mi + si) % len(formats)]
                start_time = base_day + timedelta(days=day_offset, hours=hour, minutes=minute)
                base_price = FORMAT_BASE_PRICE[fmt]
                show = Show(
                    movie_id=movie.id,
                    screen_id=screen.id,
                    format=fmt,
                    start_time=start_time,
                    price_classic=round(base_price),
                    price_premium=round(base_price * PREMIUM_MULTIPLIER),
                    price_recliner=round(base_price * RECLINER_MULTIPLIER),
                )
                db.add(show)
                shows.append(show)
    db.flush()
    return shows


def build_demo_bookings(db, user, shows):
    """A handful of confirmed bookings on already-elapsed/near-term shows so the
    admin overview dashboard has real numbers to show right after seeding."""
    rng = random.Random(42)
    booked_count = 0
    for show in shows[:6]:
        seats = (
            db.query(Seat)
            .filter(Seat.screen_id == show.screen_id)
            .order_by(Seat.row_label, Seat.col_number)
            .limit(60)
            .all()
        )
        if not seats:
            continue
        chosen = rng.sample(seats, k=min(3, len(seats)))
        total = sum(show.price_for_tier(s.tier) for s in chosen)
        booking = Booking(user_id=user.id, show_id=show.id, total_amount=total)
        db.add(booking)
        db.flush()
        for seat in chosen:
            db.add(BookingSeat(booking_id=booking.id, show_id=show.id, seat_id=seat.id))
        booked_count += 1
    db.flush()
    return booked_count


def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(User).first():
            print("Database already has data - skipping seed. Delete rc_cinemas.db (or TRUNCATE tables) to reseed.")
            return

        build_admin(db)
        demo_user = build_demo_user(db)
        screens = build_screens(db)
        movies = build_movies(db)
        shows = build_shows(db, movies, screens)
        booking_count = build_demo_bookings(db, demo_user, shows)
        db.commit()

        print(
            f"Seeded 1 admin, 1 demo user, {len(screens)} screens, {len(movies)} movies, "
            f"{len(shows)} shows, {booking_count} demo bookings."
        )
        print(f"Admin login: {SEED_ADMIN_EMAIL} / {SEED_PASSWORD}")
        print(f"Demo user login: {SEED_DEMO_EMAIL} / {SEED_PASSWORD}")
    finally:
        db.close()


if __name__ == "__main__":
    sys.exit(main() or 0)
