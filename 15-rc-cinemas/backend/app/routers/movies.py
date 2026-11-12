from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import schemas
from ..database import get_db
from ..deps import require_admin
from ..models import Movie, User

router = APIRouter(prefix="/api/movies", tags=["movies"])


@router.get("", response_model=list[schemas.MovieOut])
def list_movies(db: Session = Depends(get_db)):
    return db.query(Movie).order_by(Movie.created_at.desc()).all()


@router.get("/{movie_id}", response_model=schemas.MovieOut)
def get_movie(movie_id: int, db: Session = Depends(get_db)):
    movie = db.get(Movie, movie_id)
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    return movie


@router.post("", response_model=schemas.MovieOut, status_code=201)
def create_movie(
    payload: schemas.MovieCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    movie = Movie(**payload.model_dump())
    db.add(movie)
    db.commit()
    db.refresh(movie)
    return movie


@router.patch("/{movie_id}", response_model=schemas.MovieOut)
def update_movie(
    movie_id: int,
    payload: schemas.MovieUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    movie = db.get(Movie, movie_id)
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(movie, field, value)
    db.commit()
    db.refresh(movie)
    return movie


@router.delete("/{movie_id}", status_code=204)
def delete_movie(
    movie_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    movie = db.get(Movie, movie_id)
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    db.delete(movie)
    db.commit()
    return None
