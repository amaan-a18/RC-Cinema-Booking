import { useState, type FormEvent } from "react";
import { useDeleteShow, useUpdateShow } from "@/api/hooks";
import { extractErrorMessage } from "@/api/client";
import type { Movie, Screen, Show, ShowFormat } from "@/api/types";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";

const FORMAT_OPTIONS: ShowFormat[] = ["2D", "3D", "Dolby Atmos", "4DX"];

const inputClass =
  "rounded-sm border border-ink/20 bg-bg px-3 py-2 text-sm text-ink focus:border-gold focus:outline-none";

// The API returns (and accepts) a naive, timezone-less timestamp -- treated
// everywhere in this app as literal wall-clock digits, not UTC. Keeping this
// as pure string slicing (not a JS `Date`) avoids silently shifting the time
// by the browser's UTC offset on save.
function toLocalInputValue(iso: string): string {
  return iso.slice(0, 16);
}

interface EditShowModalProps {
  show: Show;
  movies: Movie[];
  screens: Screen[];
  onClose: () => void;
}

export function EditShowModal({ show, movies, screens, onClose }: EditShowModalProps) {
  const updateShow = useUpdateShow();
  const deleteShow = useDeleteShow();

  const [movieId, setMovieId] = useState(show.movie_id);
  const [screenId, setScreenId] = useState(show.screen_id);
  const [format, setFormat] = useState<ShowFormat>(show.format);
  const [startTime, setStartTime] = useState(toLocalInputValue(show.start_time));
  const [priceClassic, setPriceClassic] = useState(show.price_classic);
  const [pricePremium, setPricePremium] = useState(show.price_premium);
  const [priceRecliner, setPriceRecliner] = useState(show.price_recliner);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await updateShow.mutateAsync({
        id: show.id,
        movie_id: movieId,
        screen_id: screenId,
        format,
        start_time: `${startTime}:00`,
        price_classic: priceClassic,
        price_premium: pricePremium,
        price_recliner: priceRecliner,
      });
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this show?")) return;
    try {
      await deleteShow.mutateAsync(show.id);
      onClose();
    } catch (err) {
      alert(extractErrorMessage(err));
    }
  }

  return (
    <Modal title="Edit show" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <select required value={movieId} onChange={(e) => setMovieId(Number(e.target.value))} className={inputClass}>
            {movies.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>
          <select required value={screenId} onChange={(e) => setScreenId(Number(e.target.value))} className={inputClass}>
            {screens.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <select value={format} onChange={(e) => setFormat(e.target.value as ShowFormat)} className={inputClass}>
            {FORMAT_OPTIONS.map((fmt) => (
              <option key={fmt} value={fmt}>
                {fmt}
              </option>
            ))}
          </select>
          <input
            required
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <p className="mb-1.5 text-xs font-semibold text-ink-soft">Pricing by seat tier</p>
          <div className="grid grid-cols-3 gap-3">
            <input
              type="number"
              min={1}
              value={priceClassic}
              onChange={(e) => setPriceClassic(Number(e.target.value))}
              className={inputClass}
              placeholder="Classic"
            />
            <input
              type="number"
              min={1}
              value={pricePremium}
              onChange={(e) => setPricePremium(Number(e.target.value))}
              className={inputClass}
              placeholder="Premium"
            />
            <input
              type="number"
              min={1}
              value={priceRecliner}
              onChange={(e) => setPriceRecliner(Number(e.target.value))}
              className={inputClass}
              placeholder="Recliner"
            />
          </div>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="flex gap-2">
          <Button type="submit" disabled={updateShow.isPending} className="flex-1">
            {updateShow.isPending ? "Saving…" : "Save changes"}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="danger" onClick={handleDelete} disabled={deleteShow.isPending}>
            Delete
          </Button>
        </div>
      </form>
    </Modal>
  );
}
