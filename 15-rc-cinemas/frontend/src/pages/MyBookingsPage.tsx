import { useMyBookings } from "@/api/hooks";
import { Card, EmptyState, Spinner } from "@/components/common/Card";
import { formatDayLabel, formatTime } from "@/lib/date";

export function MyBookingsPage() {
  const { data: bookings, isLoading } = useMyBookings();

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="mb-6 font-display text-2xl font-bold text-ink">My Bookings</h1>

      {isLoading && (
        <div className="flex justify-center py-16 text-ink-soft">
          <Spinner />
        </div>
      )}

      {!isLoading && bookings?.length === 0 && (
        <EmptyState title="No bookings yet" hint="Browse now-showing movies to book a show." />
      )}

      <div className="space-y-4">
        {bookings?.map((booking) => (
          <Card key={booking.id} className="flex items-center gap-4 p-4">
            <img
              src={booking.show.movie.poster_url}
              alt={booking.show.movie.title}
              className="h-24 w-16 rounded-sm object-cover"
            />
            <div className="flex-1">
              <p className="font-display font-semibold text-ink">{booking.show.movie.title}</p>
              <p className="text-xs text-ink-soft">
                {formatDayLabel(booking.show.start_time)} &middot; {formatTime(booking.show.start_time)} &middot;{" "}
                {booking.show.screen.name} &middot; {booking.show.format}
              </p>
              <p className="mt-1 text-xs text-ink-soft">Seats: {booking.seat_labels.join(", ")}</p>
            </div>
            <div className="text-right">
              <p className="font-display font-bold text-ink">₹{booking.total_amount.toFixed(0)}</p>
              <p
                className={`text-[11px] uppercase ${
                  booking.status === "confirmed" ? "text-available" : "text-ink-soft"
                }`}
              >
                {booking.status}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
