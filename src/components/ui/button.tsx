"use client";

import Link from "next/link";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/client/telegram";

type Variant = "primary" | "secondary" | "soft" | "ghost" | "danger" | "premium" | "dark";
type Size = "sm" | "md" | "lg" | "icon";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand-gradient text-white shadow-brand hover:brightness-105 active:brightness-95",
  secondary: "bg-white text-ink border border-line hover:bg-brand-50 hover:border-brand-200",
  soft: "bg-brand-50 text-brand-700 hover:bg-brand-100",
  ghost: "text-ink-2 hover:bg-brand-50",
  danger: "bg-danger/10 text-danger hover:bg-danger/15",
  premium: "bg-gradient-to-br from-[#8b6cff] to-[#5b3fe0] text-white shadow-[0_10px_24px_-10px_rgb(91_63_224/0.7)] hover:brightness-105",
  dark: "bg-ink text-white hover:bg-ink-2",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm gap-1.5 rounded-xl",
  md: "h-11 px-5 text-[15px] gap-2 rounded-2xl",
  lg: "h-14 px-6 text-base gap-2.5 rounded-2xl",
  icon: "h-10 w-10 rounded-xl",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  href?: string;
  loading?: boolean;
  block?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", href, loading, block, className, children, onClick, disabled, ...rest },
  ref,
) {
  const cls = cn(
    "inline-flex select-none items-center justify-center font-bold whitespace-nowrap transition-all duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
    block && "w-full",
    className,
  );
  if (href) {
    return (
      <Link href={href} className={cls} onClick={() => haptic("light")}>
        {children}
      </Link>
    );
  }
  return (
    <button
      ref={ref}
      className={cls}
      disabled={disabled || loading}
      onClick={(e) => {
        haptic("light");
        onClick?.(e);
      }}
      {...rest}
    >
      {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
      {children}
    </button>
  );
});
