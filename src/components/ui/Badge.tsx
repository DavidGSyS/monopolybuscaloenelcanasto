import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "purple" | "yellow" | "coral" | "mint" | "neutral";
  dot?: boolean;
}

export function Badge({
  className,
  variant = "purple",
  dot = false,
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    purple: "bg-brand-purple-light text-brand-purple-dark border border-purple-200/60",
    yellow: "bg-brand-yellow-light text-amber-900 border border-amber-200/70",
    coral: "bg-brand-coral-light text-rose-900 border border-rose-200/70",
    mint: "bg-brand-mint-light text-emerald-900 border border-emerald-200/70",
    neutral: "bg-slate-100 text-slate-700 border border-slate-200",
  };

  const dotColors = {
    purple: "bg-brand-purple",
    yellow: "bg-brand-yellow",
    coral: "bg-brand-coral",
    mint: "bg-brand-mint",
    neutral: "bg-slate-400",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold select-none",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColors[variant])}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
