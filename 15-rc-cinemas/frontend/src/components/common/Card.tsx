import type { HTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx("rounded-md border border-ink/10 bg-surface shadow-sm", className)}
      {...props}
    />
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={clsx(
        "inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent",
        className,
      )}
      role="status"
      aria-label="Loading"
    />
  );
}

export function EmptyState({ title, hint, children }: { title: string; hint?: string; children?: ReactNode }) {
  return (
    <div className="rounded-md border border-dashed border-ink/20 px-6 py-10 text-center text-ink-soft">
      <p className="font-display text-sm font-semibold">{title}</p>
      {hint && <p className="mt-1 text-xs">{hint}</p>}
      {children}
    </div>
  );
}
