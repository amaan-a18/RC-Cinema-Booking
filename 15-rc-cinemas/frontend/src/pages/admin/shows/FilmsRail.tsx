import clsx from "clsx";
import type { Movie } from "@/api/types";

interface FilmsRailProps {
  movies: Movie[];
  countByMovieId: Map<number, number>;
  selectedMovieId: number | null;
  onSelect: (movieId: number | null) => void;
}

export function FilmsRail({ movies, countByMovieId, selectedMovieId, onSelect }: FilmsRailProps) {
  const totalShows = [...countByMovieId.values()].reduce((a, b) => a + b, 0);

  return (
    <div className="w-64 shrink-0">
      <button
        onClick={() => onSelect(null)}
        className={clsx(
          "mb-2 flex w-full items-center justify-between rounded-md border-l-2 px-3 py-2 text-left transition-colors",
          selectedMovieId === null
            ? "border-gold bg-ink/10 text-ink"
            : "border-transparent text-ink-soft hover:bg-ink/5 hover:text-ink",
        )}
      >
        <span className="text-sm font-semibold">All films</span>
        <span className="text-xs text-ink-soft">{totalShows}</span>
      </button>

      <div className="max-h-[560px] space-y-1 overflow-y-auto pr-1">
        {movies.map((movie) => {
          const count = countByMovieId.get(movie.id) ?? 0;
          const selected = selectedMovieId === movie.id;
          return (
            <button
              key={movie.id}
              onClick={() => onSelect(movie.id)}
              className={clsx(
                "flex w-full items-center gap-3 rounded-md border-l-2 px-3 py-2 text-left transition-colors",
                selected ? "border-gold bg-ink/10" : "border-transparent hover:bg-ink/5",
              )}
            >
              <img
                src={movie.poster_url}
                alt=""
                className="h-11 w-8 shrink-0 rounded-sm object-cover"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">{movie.title}</p>
                <p className="text-xs text-ink-soft">
                  {count === 0 ? "No shows yet" : `${count} show${count === 1 ? "" : "s"}`}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
