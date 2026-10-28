import React, { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "yellow"
    | "coral"
    | "mint"
    | "outline"
    | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      fullWidth = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-semibold rounded-2xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer";

    const variantStyles = {
      primary:
        "bg-brand-purple text-white hover:bg-brand-purple-dark focus-visible:ring-brand-purple shadow-sm hover:shadow-soft-glow",
      yellow:
        "bg-brand-yellow text-slate-900 hover:bg-brand-yellow-dark hover:text-white focus-visible:ring-brand-yellow shadow-sm hover:shadow-yellow-glow",
      coral:
        "bg-brand-coral text-white hover:bg-brand-coral-dark focus-visible:ring-brand-coral shadow-sm hover:shadow-coral-glow",
      mint:
        "bg-brand-mint text-white hover:bg-brand-mint-dark focus-visible:ring-brand-mint shadow-sm hover:shadow-mint-glow",
      outline:
        "border-2 border-brand-purple/20 text-brand-purple hover:bg-brand-purple-light focus-visible:ring-brand-purple",
      ghost:
        "text-slate-700 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-300",
    };

    const sizeStyles = {
      sm: "px-3.5 py-1.5 text-xs font-medium gap-1.5",
      md: "px-5 py-2.5 text-sm font-semibold gap-2",
      lg: "px-6 py-3.5 text-base font-bold gap-2.5",
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
