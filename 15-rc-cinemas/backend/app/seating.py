"""Seat layout generation, shared by the screens router and the seed script.

Tier assignment is rule-based from a seat's row position in the grid:
  - the back row(s) are full-width recliners (best legroom, lounge seating)
  - a full-width band of middle rows is premium (best angle on the screen,
    far enough back to not crane your neck, close enough to feel immersive)
  - everything else is classic
"""
from sqlalchemy.orm import Session

from .models import Screen, Seat, SeatTier


def tier_for_position(row_index: int, rows: int) -> SeatTier:
    recliner_rows = 2 if rows >= 8 else (1 if rows >= 4 else 0)
    if row_index >= rows - recliner_rows:
        return SeatTier.recliner

    front_buffer = max(1, round(rows * 0.2))
    is_middle_row = front_buffer <= row_index < rows - recliner_rows
    if is_middle_row:
        return SeatTier.premium

    return SeatTier.classic


def generate_seats(db: Session, screen: Screen) -> None:
    for r in range(screen.rows):
        row_label = chr(ord("A") + r)
        tier = tier_for_position(r, screen.rows)
        for c in range(1, screen.cols + 1):
            db.add(
                Seat(
                    screen_id=screen.id,
                    row_label=row_label,
                    col_number=c,
                    label=f"{row_label}{c}",
                    tier=tier,
                )
            )
