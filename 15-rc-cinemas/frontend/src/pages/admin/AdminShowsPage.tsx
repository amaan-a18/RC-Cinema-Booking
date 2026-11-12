import { useMemo, useState } from "react";
import { useMovies, useScreens, useShows } from "@/api/hooks";
import type { Show } from "@/api/types";
import { Button } from "@/components/common/Button";
import { EmptyState, Spinner } from "@/components/common/Card";
import { formatTime } from "@/lib/date";
import { buildDayWindow } from "@/lib/schedule";
import { DayStrip } from "@/pages/admin/shows/DayStrip";
import { EditShowModal } from "@/pages/admin/shows/EditShowModal";
import { FilmsRail } from "@/pages/admin/shows/FilmsRail";
import { ScheduleShowModal } from "@/pages/admin/shows/ScheduleShowModal";

const DAY_WINDOW = 14;

export function AdminShowsPage() {
  const { data: movies, isLoading: moviesLoading } = useMovies();
  const { data: screens, isLoading: screensLoading } = useScreens();
  const { data: shows, isLoading: showsLoading } = useShows();

  const days = useMemo(() => buildDayWindow(DAY_WINDOW), []);
  const [selectedDateStr, setSelectedDateStr] = useState(days[0].dateStr);
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [editingShow, setEditingShow] = useState<Show | null>(null);

  const countByMovieId = useMemo(() => {
    const counts = new Map<number, number>();
    for (const show of shows ?? []) {
      counts.set(show.movie_id, (counts.get(show.movie_id) ?? 0) + 1);
    }
    return counts;
  }, [shows]);

  const scopedShows = useMemo(
    () => (selectedMovieId === null ? (shows ?? []) : (shows ?? []).filter((s) => s.movie_id === selectedMovieId)),
    [shows, selectedMovieId],
  );

  const daysWithCounts = useMemo(
    () =>
      days.map((day) => ({
        ...day,
        count: scopedShows.filter((s) => s.start_time.slice(0, 10) === day.dateStr).length,
      })),
    [days, scopedShows],
  );

  const screenGroups = useMemo(() => {
    const dayShows = scopedShows.filter((s) => s.start_time.slice(0, 10) === selectedDateStr);
    const byScreen = new Map<number, { screenName: string; shows: Show[] }>();
    for (const show of dayShows) {
      const entry = byScreen.get(show.screen_id) ?? { screenName: show.screen.name, shows: [] };
      entry.shows.push(show);
      byScreen.set(show.screen_id, entry);
    }
    return [...byScreen.values()]
      .map((g) => ({ ...g, shows: g.shows.sort((a, b) => a.start_time.localeCompare(b.start_time)) }))
      .sort((a, b) => a.screenName.localeCompare(b.screenName));
  }, [scopedShows, selectedDateStr]);

  const loading = moviesLoading || screensLoading || showsLoading;
  const selectedDay = days.find((d) => d.dateStr === selectedDateStr);
  const totalOnDay = screenGroups.reduce((sum, g) => sum + g.shows.length, 0);

  return (
    <div className="mx-auto max-w-7xl px-8 py-10">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Shows</h1>
          <p className="mt-1 text-sm text-ink-soft">Browse by film and day, and schedule showtimes in bulk.</p>
        </div>
        <Button onClick={() => setScheduleOpen(true)}>Schedule a showtime</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-ink-soft">
          <Spinner />
        </div>
      ) : (
        <div className="flex gap-8">
          <FilmsRail
            movies={movies ?? []}
            countByMovieId={countByMovieId}
            selectedMovieId={selectedMovieId}
            onSelect={setSelectedMovieId}
          />

          <div className="min-w-0 flex-1">
            <DayStrip days={daysWithCounts} selectedDateStr={selectedDateStr} onSelect={setSelectedDateStr} />

            <div className="mt-5">
              {totalOnDay === 0 ? (
                <EmptyState
                  title={`Nothing scheduled for ${selectedDay?.label ?? "this day"}`}
                  hint="Schedule a showtime to fill the slot."
                >
                  <Button size="sm" className="mt-4" onClick={() => setScheduleOpen(true)}>
                    Schedule a showtime
                  </Button>
                </EmptyState>
              ) : (
                <div className="space-y-5">
                  {screenGroups.map((group) => (
                    <div key={group.screenName}>
                      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-soft">
                        {group.screenName}
                      </p>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {group.shows.map((show) => (
                          <button
                            key={show.id}
                            onClick={() => setEditingShow(show)}
                            className="rounded-md border border-ink/10 bg-surface p-3 text-left transition-colors hover:border-gold/40"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-display text-sm font-bold text-ink">
                                {formatTime(show.start_time)}
                              </span>
                              <span className="text-[11px] uppercase tracking-wide text-ink-soft">
                                {show.format}
                              </span>
                            </div>
                            <p className="mt-0.5 truncate text-sm text-ink">{show.movie.title}</p>
                            <p className="mt-1 text-xs text-ink-soft">
                              ₹{show.price_classic.toFixed(0)} / ₹{show.price_premium.toFixed(0)} / ₹
                              {show.price_recliner.toFixed(0)}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {scheduleOpen && (
        <ScheduleShowModal
          movies={movies ?? []}
          screens={screens ?? []}
          defaultMovieId={selectedMovieId}
          defaultDateStr={selectedDateStr}
          onClose={() => setScheduleOpen(false)}
        />
      )}

      {editingShow && (
        <EditShowModal
          show={editingShow}
          movies={movies ?? []}
          screens={screens ?? []}
          onClose={() => setEditingShow(null)}
        />
      )}
    </div>
  );
}
