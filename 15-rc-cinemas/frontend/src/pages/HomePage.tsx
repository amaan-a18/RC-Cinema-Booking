import { Link } from "react-router-dom";
import { useMovies } from "@/api/hooks";
import { Card, EmptyState, Spinner } from "@/components/common/Card";

export function HomePage() {
  const { data: movies, isLoading } = useMovies();

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <section className="mb-10 rounded-md border border-gold/20 bg-gradient-to-br from-surface to-bg p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Welcome to</p>
        <h1 className="mt-1 font-display text-4xl font-bold text-ink">RC CINEMAS</h1>
        <p className="mt-2 max-w-xl text-sm text-ink-soft">
          Pick a film, pick a show, and choose your seat in a real 3D hall -- with the trailer
          playing on the big screen while you decide.
        </p>
      </section>

      <h2 className="mb-4 font-display text-xl font-semibold text-ink">Now Showing</h2>

      {isLoading && (
        <div className="flex justify-center py-16 text-ink-soft">
          <Spinner />
        </div>
      )}

      {!isLoading && movies?.length === 0 && (
        <EmptyState title="No movies yet" hint="Check back soon." />
      )}

      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {movies?.map((movie) => (
          <Link key={movie.id} to={`/movies/${movie.id}`}>
            <Card className="overflow-hidden transition-transform hover:-translate-y-1 hover:border-gold/40">
              <img src={movie.poster_url} alt={movie.title} className="aspect-[2/3] w-full object-cover" />
              <div className="p-3">
                <p className="truncate font-display text-sm font-semibold text-ink">{movie.title}</p>
                <p className="mt-0.5 truncate text-xs text-ink-soft">
                  {movie.language} &middot; {movie.genre}
                </p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
