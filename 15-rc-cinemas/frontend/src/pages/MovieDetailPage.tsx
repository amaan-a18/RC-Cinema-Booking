import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMovie, useShows } from "@/api/hooks";
import { Button } from "@/components/common/Button";
import { Card, Spinner } from "@/components/common/Card";
import { formatDayLabel, formatTime, dateKey } from "@/lib/date";

export function MovieDetailPage() {
  const { movieId } = useParams();
  const navigate = useNavigate();
  const id = Number(movieId);
  const { data: movie, isLoading: movieLoading } = useMovie(id);
  const { data: shows, isLoading: showsLoading } = useShows({ movieId: id });
  const [trailerOpen, setTrailerOpen] = useState(false);

  const showsByDate = useMemo(() => {
    const grouped = new Map<string, typeof shows>();
    for (const show of shows ?? []) {
      const key = dateKey(show.start_time);
      const list = grouped.get(key) ?? [];
      list.push(show);
      grouped.set(key, list);
    }
    return [...grouped.entries()];
  }, [shows]);

  if (movieLoading || !movie) {
    return (
      <div className="flex justify-center py-24 text-ink-soft">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-[280px_1fr]">
        <img
          src={movie.poster_url}
          alt={movie.title}
          className="aspect-[2/3] w-full rounded-md object-cover shadow-lg"
        />
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">{movie.title}</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {movie.cert} &middot; {movie.duration_minutes} min &middot; {movie.language} &middot; {movie.genre}
          </p>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink/90">{movie.synopsis}</p>

          {movie.trailer_youtube_id && (
            <Button className="mt-5" onClick={() => setTrailerOpen(true)}>
              ▶ Watch Trailer
            </Button>
          )}
        </div>
      </div>

      <h2 className="mb-4 mt-10 font-display text-xl font-semibold text-ink">Shows</h2>

      {showsLoading && (
        <div className="flex justify-center py-10 text-ink-soft">
          <Spinner />
        </div>
      )}

      {!showsLoading && showsByDate.length === 0 && (
        <p className="text-sm text-ink-soft">No shows scheduled right now.</p>
      )}

      <div className="space-y-6">
        {showsByDate.map(([date, dayShows]) => (
          <Card key={date} className="p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gold">
              {formatDayLabel(dayShows![0].start_time)}
            </p>
            <div className="flex flex-wrap gap-2">
              {dayShows!.map((show) => (
                <button
                  key={show.id}
                  onClick={() => navigate(`/shows/${show.id}/seats`)}
                  className="rounded-sm border border-ink/15 px-3 py-2 text-left text-xs hover:border-gold/60 hover:bg-gold/10"
                >
                  <span className="block font-semibold text-ink">{formatTime(show.start_time)}</span>
                  <span className="block text-ink-soft">
                    {show.screen.name} &middot; {show.format} &middot; from ₹{show.price_classic.toFixed(0)}
                  </span>
                </button>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {trailerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setTrailerOpen(false)}
        >
          <div className="aspect-video w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <iframe
              className="h-full w-full rounded-md"
              src={`https://www.youtube.com/embed/${movie.trailer_youtube_id}?autoplay=1`}
              title={`${movie.title} trailer`}
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
}
