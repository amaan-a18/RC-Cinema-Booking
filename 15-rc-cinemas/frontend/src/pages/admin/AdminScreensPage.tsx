import { Fragment, useMemo, useState, type FormEvent } from "react";
import {
  useCreateScreen,
  useDeleteScreen,
  useScreens,
  useScreenSeats,
  useUpdateScreen,
} from "@/api/hooks";
import { extractErrorMessage } from "@/api/client";
import { SEAT_TIER_LABEL, type SeatTier } from "@/api/types";
import { Button } from "@/components/common/Button";
import { Card, Spinner } from "@/components/common/Card";

const inputClass =
  "rounded-sm border border-ink/20 bg-bg px-3 py-2 text-sm text-ink focus:border-gold focus:outline-none";

const TIER_ORDER: SeatTier[] = ["classic", "premium", "recliner"];

function SeatBreakdown({ screenId }: { screenId: number }) {
  const { data: seats, isLoading } = useScreenSeats(screenId);

  const counts = useMemo(() => {
    const result: Record<SeatTier, number> = { classic: 0, premium: 0, recliner: 0 };
    for (const seat of seats ?? []) result[seat.tier] += 1;
    return result;
  }, [seats]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-4 text-ink-soft">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex gap-6 px-4 py-3 text-xs text-ink-soft">
      {TIER_ORDER.map((tier) => (
        <span key={tier}>
          <strong className="text-ink">{counts[tier]}</strong> {SEAT_TIER_LABEL[tier]}
        </span>
      ))}
    </div>
  );
}

export function AdminScreensPage() {
  const { data: screens, isLoading } = useScreens();
  const createScreen = useCreateScreen();
  const updateScreen = useUpdateScreen();
  const deleteScreen = useDeleteScreen();

  const [form, setForm] = useState({ name: "", rows: 8, cols: 12 });
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createScreen.mutateAsync(form);
      setForm({ name: "", rows: 8, cols: 12 });
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  async function handleRename(id: number, name: string) {
    try {
      await updateScreen.mutateAsync({ id, name });
    } catch (err) {
      alert(extractErrorMessage(err));
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this screen? This only works if it has no shows scheduled.")) return;
    try {
      await deleteScreen.mutateAsync(id);
    } catch (err) {
      alert(extractErrorMessage(err));
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-8 py-10">
      <h1 className="font-display text-2xl font-bold text-ink">Screens &amp; Seating</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Each screen auto-generates a seat map: a center block of Premium seats in the middle rows for the best
        view, Recliner seats across the back row(s), and Classic everywhere else.
      </p>

      {isLoading ? (
        <div className="flex justify-center py-8 text-ink-soft">
          <Spinner />
        </div>
      ) : (
        <Card className="mt-6 overflow-x-auto p-0">
          <table className="w-full min-w-[560px] text-left text-xs">
            <thead>
              <tr className="border-b border-ink/10 bg-ink/5 text-ink-soft">
                <th className="px-3 py-2 font-semibold uppercase tracking-wide">Name</th>
                <th className="px-3 py-2 font-semibold uppercase tracking-wide">Layout</th>
                <th className="px-3 py-2 font-semibold uppercase tracking-wide">Seats</th>
                <th className="px-3 py-2 font-semibold uppercase tracking-wide"></th>
              </tr>
            </thead>
            <tbody>
              {(screens ?? []).map((s) => (
                <Fragment key={s.id}>
                  <tr className="border-b border-ink/5">
                    <td className="px-3 py-2">
                      <input
                        defaultValue={s.name}
                        onBlur={(e) => {
                          if (e.target.value.trim() && e.target.value !== s.name) {
                            handleRename(s.id, e.target.value.trim());
                          }
                        }}
                        className="w-full rounded-sm border border-transparent bg-transparent px-1 py-0.5 focus:border-gold focus:bg-bg focus:outline-none"
                      />
                    </td>
                    <td className="px-3 py-2">
                      {s.rows} rows &times; {s.cols} cols
                    </td>
                    <td className="px-3 py-2">{s.rows * s.cols}</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                        className="mr-3 text-gold hover:underline"
                      >
                        {expandedId === s.id ? "Hide tiers" : "View tiers"}
                      </button>
                      <button onClick={() => handleDelete(s.id)} className="text-red-400 hover:underline">
                        Delete
                      </button>
                    </td>
                  </tr>
                  {expandedId === s.id && (
                    <tr className="border-b border-ink/5 bg-ink/5">
                      <td colSpan={4} className="p-0">
                        <SeatBreakdown screenId={s.id} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Card className="mt-4 p-5">
        <h3 className="font-display text-sm font-bold uppercase tracking-wide text-ink">Add screen</h3>
        <form onSubmit={handleCreate} className="mt-3 grid gap-3 sm:grid-cols-3">
          <input
            required
            placeholder="Name (e.g. Audi 4)"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className={`${inputClass} sm:col-span-1`}
          />
          <input
            type="number"
            min={1}
            max={26}
            placeholder="Rows"
            value={form.rows}
            onChange={(e) => setForm((f) => ({ ...f, rows: Number(e.target.value) }))}
            className={inputClass}
          />
          <input
            type="number"
            min={1}
            max={40}
            placeholder="Columns"
            value={form.cols}
            onChange={(e) => setForm((f) => ({ ...f, cols: Number(e.target.value) }))}
            className={inputClass}
          />
          {error && <p className="text-xs text-red-400 sm:col-span-3">{error}</p>}
          <div className="sm:col-span-3">
            <Button type="submit" disabled={createScreen.isPending}>
              Add screen
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
