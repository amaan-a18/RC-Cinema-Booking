import { useMemo, useState, type FormEvent } from "react";
import clsx from "clsx";
import { useBulkCreateShows } from "@/api/hooks";
import { extractErrorMessage } from "@/api/client";
import type { Movie, Screen, ShowFormat } from "@/api/types";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { countOccurrences, WEEKDAY_LABELS } from "@/lib/schedule";

const FORMAT_OPTIONS: ShowFormat[] = ["2D", "3D", "Dolby Atmos", "4DX"];

// Suggested classic-tier price by format, scaled the same way as the seed
// data's premium/recliner multipliers -- a starting point the admin can
// still override per show.
const FORMAT_BASE_PRICE: Record<ShowFormat, number> = {
  "2D": 150,
  "3D": 220,
  "Dolby Atmos": 260,
  "4DX": 300,
};
const PREMIUM_MULTIPLIER = 1.35;
const RECLINER_MULTIPLIER = 1.9;

function suggestPrices(format: ShowFormat) {
  const base = FORMAT_BASE_PRICE[format];
  return {
    price_classic: Math.round(base),
    price_premium: Math.round(base * PREMIUM_MULTIPLIER),
    price_recliner: Math.round(base * RECLINER_MULTIPLIER),
  };
}

const inputClass =
  "rounded-sm border border-ink/20 bg-bg px-3 py-2 text-sm text-ink focus:border-gold focus:outline-none";

interface ScheduleShowModalProps {
  movies: Movie[];
  screens: Screen[];
  defaultMovieId: number | null;
  defaultDateStr: string;
  onClose: () => void;
}

export function ScheduleShowModal({ movies, screens, defaultMovieId, defaultDateStr, onClose }: ScheduleShowModalProps) {
  const bulkCreate = useBulkCreateShows();

  const [movieId, setMovieId] = useState<number | "">(defaultMovieId ?? "");
  const [screenId, setScreenId] = useState<number | "">("");
  const [format, setFormat] = useState<ShowFormat>("2D");
  const [timeOfDay, setTimeOfDay] = useState("10:00");
  const [startDate, setStartDate] = useState(defaultDateStr);
  const [endDate, setEndDate] = useState(defaultDateStr);
  const [days, setDays] = useState<Set<number>>(new Set([0, 1, 2, 3, 4, 5, 6]));
  const [prices, setPrices] = useState(suggestPrices("2D"));
  const [pricesTouched, setPricesTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdCount, setCreatedCount] = useState<number | null>(null);

  function handleFormatChange(next: ShowFormat) {
    setFormat(next);
    if (!pricesTouched) setPrices(suggestPrices(next));
  }

  function toggleDay(index: number) {
    setDays((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  const previewCount = useMemo(
    () => countOccurrences(startDate, endDate, days),
    [startDate, endDate, days],
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (movieId === "" || screenId === "") {
      setError("Pick a film and a screen.");
      return;
    }
    if (previewCount === 0) {
      setError("No dates in range match the selected days.");
      return;
    }
    try {
      const created = await bulkCreate.mutateAsync({
        movie_id: movieId,
        screen_id: screenId,
        format,
        time_of_day: timeOfDay,
        start_date: startDate,
        end_date: endDate,
        days_of_week: [...days],
        ...prices,
      });
      setCreatedCount(created.length);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  if (createdCount !== null) {
    return (
      <Modal title="Scheduled" onClose={onClose}>
        <p className="text-sm text-ink-soft">
          Added <strong className="text-ink">{createdCount}</strong> show{createdCount === 1 ? "" : "s"} to the
          schedule.
        </p>
        <Button className="mt-5 w-full" onClick={onClose}>
          Done
        </Button>
      </Modal>
    );
  }

  return (
    <Modal title="Schedule a showtime" onClose={onClose} widthClass="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <select required value={movieId} onChange={(e) => setMovieId(Number(e.target.value))} className={inputClass}>
            <option value="">Film</option>
            {movies.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>
          <select required value={screenId} onChange={(e) => setScreenId(Number(e.target.value))} className={inputClass}>
            <option value="">Screen</option>
            {screens.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <select value={format} onChange={(e) => handleFormatChange(e.target.value as ShowFormat)} className={inputClass}>
            {FORMAT_OPTIONS.map((fmt) => (
              <option key={fmt} value={fmt}>
                {fmt}
              </option>
            ))}
          </select>
          <input
            required
            type="time"
            value={timeOfDay}
            onChange={(e) => setTimeOfDay(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <p className="mb-1.5 text-xs font-semibold text-ink-soft">Repeats on</p>
          <div className="flex gap-1.5">
            {WEEKDAY_LABELS.map((label, index) => (
              <button
                key={label}
                type="button"
                onClick={() => toggleDay(index)}
                className={clsx(
                  "h-9 flex-1 rounded-sm border text-xs font-semibold transition-colors",
                  days.has(index)
                    ? "border-gold bg-gold text-bg"
                    : "border-ink/20 text-ink-soft hover:border-gold/40",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-soft">From</label>
            <input
              required
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={`${inputClass} w-full`}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-soft">To</label>
            <input
              required
              type="date"
              min={startDate}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={`${inputClass} w-full`}
            />
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-semibold text-ink-soft">Pricing by seat tier</p>
          <div className="grid grid-cols-3 gap-3">
            {(["price_classic", "price_premium", "price_recliner"] as const).map((key) => (
              <input
                key={key}
                type="number"
                min={1}
                value={prices[key]}
                onChange={(e) => {
                  setPricesTouched(true);
                  setPrices((p) => ({ ...p, [key]: Number(e.target.value) }));
                }}
                className={inputClass}
                placeholder={key === "price_classic" ? "Classic" : key === "price_premium" ? "Premium" : "Recliner"}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-md border border-gold/20 bg-gold/10 px-3 py-2">
          <p className="text-sm text-ink">
            This will add <strong className="text-gold">{previewCount}</strong> show{previewCount === 1 ? "" : "s"}
          </p>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="flex gap-2">
          <Button type="submit" disabled={bulkCreate.isPending || previewCount === 0} className="flex-1">
            {bulkCreate.isPending ? "Scheduling…" : "Schedule"}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}
