import type { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

type Variant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "sm" | "md";
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-gold text-bg hover:bg-gold/90 disabled:bg-gold/30",
  secondary: "bg-transparent text-ink border border-ink/25 hover:bg-ink/5 disabled:opacity-40",
  ghost: "bg-transparent text-ink hover:bg-ink/5 disabled:opacity-40",
  danger: "bg-red-600 text-ink hover:bg-red-500 disabled:bg-red-900",
};

export function Button({ variant = "primary", size = "md", className, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-sm font-semibold tracking-wide transition-colors disabled:cursor-not-allowed",
        size === "md" ? "px-4 py-2 text-sm" : "px-3 py-1.5 text-xs",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
