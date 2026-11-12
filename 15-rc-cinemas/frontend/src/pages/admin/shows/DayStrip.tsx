import clsx from "clsx";
import type { DayCell } from "@/lib/schedule";

interface DayStripProps {
  days: (DayCell & { count: number })[];
  selectedDateStr: string;
  onSelect: (dateStr: string) => void;
}

export function DayStrip({ days, selectedDateStr, onSelect }: DayStripProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {days.map((day) => {
        const selected = day.dateStr === selectedDateStr;
        return (
          <button
            key={day.dateStr}
            onClick={() => onSelect(day.dateStr)}
            className={clsx(
              "shrink-0 rounded-md border px-3 py-2 text-left transition-colors",
              selected
                ? "border-gold bg-gold text-bg"
                : "border-ink/10 bg-surface text-ink hover:border-gold/40",
            )}
          >
            <p className="text-sm font-semibold">{day.label}</p>
            <p className={clsx("text-xs", selected ? "text-bg/70" : "text-ink-soft")}>
              {day.count === 0 ? "Nothing on" : `${day.count} show${day.count === 1 ? "" : "s"}`}
            </p>
          </button>
        );
      })}
    </div>
  );
}
