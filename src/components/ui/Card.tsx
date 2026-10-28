import React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "accent" | "interactive";
}

export function Card({
  className,
  variant = "default",
  children,
  ...props
}: CardProps) {
  const variantStyles = {
    default:
      "bg-white border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]",
    elevated:
      "bg-white border border-slate-100/80 shadow-[0_10px_30px_-5px_rgba(109,40,217,0.08)]",
    accent:
      "bg-gradient-to-br from-brand-purple to-brand-purple-dark text-white shadow-soft-glow border-none",
    interactive:
      "bg-white border border-slate-200/80 hover:border-brand-purple/40 shadow-sm hover:shadow-[0_12px_28px_-6px_rgba(109,40,217,0.12)] transition-all duration-300 cursor-pointer active:scale-[0.99]",
  };

  return (
    <div
      className={cn(
        "rounded-3xl p-6 transition-all duration-200",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-start justify-between gap-4 mb-4", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-lg font-bold text-slate-900 tracking-tight", className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-sm text-slate-600 leading-relaxed", className)} {...props}>
      {children}
    </p>
  );
}
