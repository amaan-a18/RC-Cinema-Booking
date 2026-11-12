import { useAdminOverview } from "@/api/hooks";
import { Card, EmptyState, Spinner } from "@/components/common/Card";
import { formatDate, formatTime } from "@/lib/date";

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-ink">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-ink-soft">{sub}</p>}
    </Card>
  );
}

export function AdminOverviewPage() {
  const { data, isLoading } = useAdminOverview();

  return (
    <div className="mx-auto max-w-6xl px-8 py-10">
      <h1 className="font-display text-2xl font-bold text-ink">Overview</h1>
      <p className="mt-1 text-sm text-ink-soft">A snapshot of RC Cinemas right now.</p>

      {isLoading || !data ? (
        <div className="flex justify-center py-16 text-ink-soft">
          <Spinner />
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <StatCard label="Revenue" value={`₹${data.total_revenue.toFixed(0)}`} sub={`₹${data.revenue_today.toFixed(0)} today`} />
            <StatCard label="Bookings" value={String(data.total_bookings)} sub={`${data.seats_booked} seats booked`} />
            <StatCard label="Shows" value={String(data.total_shows)} sub={`${data.shows_today} today · ${data.upcoming_shows} upcoming`} />
            <StatCard label="Movies" value={String(data.total_movies)} />
            <StatCard label="Screens" value={String(data.total_screens)} sub={`${data.total_seats} total seats`} />
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section>
              <h2 className="font-display text-sm font-bold uppercase tracking-wide text-ink">Upcoming shows</h2>
              {data.upcoming.length === 0 ? (
                <EmptyState title="Nothing scheduled" hint="Add a show from the Shows tab." />
              ) : (
                <Card className="mt-3 divide-y divide-ink/10 p-0">
                  {data.upcoming.map((show) => (
                    <div key={show.id} className="flex items-center justify-between px-4 py-3 text-sm">
                      <div>
                        <p className="font-semibold text-ink">{show.movie.title}</p>
                        <p className="text-xs text-ink-soft">
                          {show.screen.name} &middot; {show.format}
                        </p>
                      </div>
                      <div className="text-right text-xs text-ink-soft">
                        <p>{formatDate(show.start_time)}</p>
                        <p>{formatTime(show.start_time)}</p>
                      </div>
                    </div>
                  ))}
                </Card>
              )}
            </section>

            <section>
              <h2 className="font-display text-sm font-bold uppercase tracking-wide text-ink">Recent bookings</h2>
              {data.recent_bookings.length === 0 ? (
                <EmptyState title="No bookings yet" />
              ) : (
                <Card className="mt-3 divide-y divide-ink/10 p-0">
                  {data.recent_bookings.map((b) => (
                    <div key={b.id} className="flex items-center justify-between px-4 py-3 text-sm">
                      <div>
                        <p className="font-semibold text-ink">{b.movie_title}</p>
                        <p className="text-xs text-ink-soft">
                          {b.user_name} &middot; {b.screen_name} &middot; {b.seat_labels.join(", ")}
                        </p>
                      </div>
                      <p className="font-display text-sm font-bold text-gold">₹{b.total_amount.toFixed(0)}</p>
                    </div>
                  ))}
                </Card>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
