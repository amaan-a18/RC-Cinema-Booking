import type { SeatMapEntry, SeatTier } from "@/api/types";

export const COL_SPACING = 0.78;
export const ROW_SPACING = 0.85;
export const AISLE_GAP = 0.6;

/** Extra z-gap inserted between tier bands -- an "empty row" of breathing
 * room that visually separates the recliner block from premium/classic,
 * the way physical cinemas (and booking-site seat maps) step the tiers
 * apart instead of running them edge-to-edge. */
export const TIER_GAP = ROW_SPACING * 1.4;

/** X position of a seat column, with a center-aisle gap, mirroring the backend's row/col grid. */
export function xForCol(colNumber: number, totalCols: number): number {
  const c = colNumber - 1;
  const midCol = (totalCols - 1) / 2;
  const base = (c - midCol) * COL_SPACING;
  return c >= Math.ceil(totalCols / 2) ? base + AISLE_GAP : base;
}

/** A row's dominant tier band for spacing purposes: a row counts as
 * "recliner" only when every seat is a recliner, "premium" when it
 * contains any premium seats (even flanked by classic seats in the same
 * row), and "classic" otherwise. */
export function rowBand(rowSeats: SeatMapEntry[]): SeatTier {
  if (rowSeats.length > 0 && rowSeats.every((s) => s.tier === "recliner")) return "recliner";
  if (rowSeats.some((s) => s.tier === "premium")) return "premium";
  return "classic";
}

/** Z position for each row, in array order matching `rows`. Rows within
 * the same tier band sit at the normal ROW_SPACING; crossing into a new
 * band inserts TIER_GAP as well, producing the "layered" look. */
export function computeRowZPositions(rows: [string, SeatMapEntry[]][]): number[] {
  const z: number[] = [];
  let cursor = 0;
  let prevBand: SeatTier | null = null;

  rows.forEach(([, seats], index) => {
    const band = rowBand(seats);
    if (index > 0) {
      cursor += band !== prevBand ? ROW_SPACING + TIER_GAP : ROW_SPACING;
    }
    z.push(cursor);
    prevBand = band;
  });

  return z;
}
