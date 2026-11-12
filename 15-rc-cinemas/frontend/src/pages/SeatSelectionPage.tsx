import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCreateBooking, useSeatMap, useShow } from "@/api/hooks";
import { extractErrorMessage } from "@/api/client";
import { priceForTier, SEAT_TIER_BLURB, SEAT_TIER_COLOR, SEAT_TIER_LABEL, type SeatTier } from "@/api/types";
import { Button } from "@/components/common/Button";
import { Spinner } from "@/components/common/Card";
import { SeatCanvas } from "@/components/seats/SeatCanvas";
import { formatDayLabel, formatTime } from "@/lib/date";

const TIER_ORDER: SeatTier[] = ["classic", "premium", "recliner"];

const MAX_SEATS = 8;

export function SeatSelectionPage() {
  const { showId } = useParams();
  const navigate = useNavigate();
  const id = Number(showId);

  const { data: show, isLoading: showLoading } = useShow(id);
  const { data: seatMap, isLoading: seatsLoading } = useSeatMap(id);
  const createBooking = useCreateBooking();

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [confirmedLabels, setConfirmedLabels] = useState<string[] | null>(null);

  const takenIds = useMemo(
    () => new Set((seatMap?.seats ?? []).filter((s) => s.taken).map((s) => s.id)),
    [seatMap],
  );

  const seatsById = useMemo(
    () => new Map((seatMap?.seats ?? []).map((s) => [s.id, s])),
    [seatMap],
  );

  const tierCounts = useMemo(() => {
    const counts: Record<SeatTier, number> = { classic: 0, premium: 0, recliner: 0 };
    for (const seatId of selectedIds) {
      const tier = seatsById.get(seatId)?.tier;
      if (tier) counts[tier] += 1;
    }
    return counts;
  }, [selectedIds, seatsById]);

  function toggleSeat(seatId: number) {
    setError(null);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(seatId)) {
        next.delete(seatId);
      } else if (next.size < MAX_SEATS) {
        next.add(seatId);
      }
      return next;
    });
  }

  async function handleConfirm() {
    if (!show || selectedIds.size === 0) return;
    setError(null);
    try {
      const booking = await createBooking.mutateAsync({
        show_id: show.id,
        seat_ids: [...selectedIds],
      });
      setConfirmedLabels(booking.seat_labels);
      setSelectedIds(new Set());
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  if (showLoading || seatsLoading || !show || !seatMap) {
    return (
      <div className="flex justify-center py-24 text-ink-soft">
        <Spinner />
      </div>
    );
  }

  const total = TIER_ORDER.reduce((sum, tier) => sum + tierCounts[tier] * priceForTier(show, tier), 0);
  const priceByTier: Record<SeatTier, number> = {
    classic: show.price_classic,
    premium: show.price_premium,
    recliner: show.price_recliner,
  };

  if (confirmedLabels) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <p className="text-5xl">🎟️</p>
        <h1 className="mt-4 font-display text-2xl font-bold text-ink">Booking confirmed</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Seats {confirmedLabels.join(", ")} for <strong className="text-ink">{show.movie.title}</strong> --{" "}
          {formatDayLabel(show.start_time)} at {formatTime(show.start_time)}, {show.screen.name} ({show.format}).
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button variant="secondary" onClick={() => navigate(`/movies/${show.movie_id}`)}>
            Back to movie
          </Button>
          <Button onClick={() => navigate("/my-bookings")}>View my bookings</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-4">
        <h1 className="font-display text-xl font-semibold text-ink">{show.movie.title}</h1>
        <p className="text-sm text-ink-soft">
          {formatDayLabel(show.start_time)} &middot; {formatTime(show.start_time)} &middot; {show.screen.name}{" "}
          &middot; {show.format}
        </p>
      </div>

      <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {TIER_ORDER.map((tier) => (
          <div
            key={tier}
            className="flex items-center justify-between gap-3 rounded-md border-l-2 bg-surface px-3 py-2"
            style={{ borderColor: SEAT_TIER_COLOR[tier] }}
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: SEAT_TIER_COLOR[tier] }}>
                {SEAT_TIER_LABEL[tier]}
              </p>
              <p className="text-[11px] text-ink-soft">{SEAT_TIER_BLURB[tier]}</p>
            </div>
            <p className="font-display text-sm font-bold text-ink">₹{priceForTier(show, tier).toFixed(0)}</p>
          </div>
        ))}
      </div>

      <SeatCanvas
        seats={seatMap.seats}
        cols={seatMap.cols}
        selectedIds={selectedIds}
        takenIds={takenIds}
        trailerYoutubeId={show.movie.trailer_youtube_id}
        priceByTier={priceByTier}
        onToggleSeat={toggleSeat}
      />

      <div className="mt-4 flex flex-wrap items-center gap-6 text-xs text-ink-soft">
        <LegendDot color="#2F7A6D" label="Available" />
        <LegendDot color="#D4AF37" label="Selected" />
        <LegendDot color="#55555E" label="Taken" />
        <span>Drag to rotate the view, scroll to zoom. Up to {MAX_SEATS} seats.</span>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-md border border-ink/10 bg-surface p-4">
        <div>
          <p className="text-sm text-ink-soft">
            {selectedIds.size === 0
              ? "No seats selected"
              : TIER_ORDER.filter((tier) => tierCounts[tier] > 0)
                  .map((tier) => `${tierCounts[tier]} ${SEAT_TIER_LABEL[tier]}`)
                  .join(" + ")}
          </p>
          <p className="font-display text-xl font-bold text-ink">₹{total.toFixed(0)}</p>
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <Button
          size="md"
          disabled={selectedIds.size === 0 || createBooking.isPending}
          onClick={handleConfirm}
        >
          {createBooking.isPending ? <Spinner /> : "Confirm booking"}
        </Button>
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
