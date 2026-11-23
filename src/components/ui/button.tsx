import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

const BASE =
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-md border font-medium whitespace-nowrap transition-colors select-none disabled:cursor-default disabled:opacity-50 pointer-coarse:min-h-10 [&_svg]:size-3.5 [&_svg]:shrink-0";

const VARIANTS = {
  primary: "border-ink bg-ink text-inverse hover:opacity-90",
  secondary: "border-line-strong bg-bg text-ink hover:bg-subtle",
  ghost: "border-transparent text-muted hover:bg-sunken hover:text-ink",
  danger: "border-line-strong bg-bg text-critical hover:bg-critical-bg",
} as const;

const SIZES = {
  sm: "h-7 px-2 text-xs",
  md: "h-8 px-3 text-[13px]",
  lg: "h-10 px-4 text-sm",
} as const;

export type ButtonStyle = { variant?: keyof typeof VARIANTS; size?: keyof typeof SIZES };

/** Class names for anything that should look like a button, e.g. a `<Link>`. */
export function buttonClass({ variant = "secondary", size = "md" }: ButtonStyle = {}, className?: string) {
  return cn(BASE, VARIANTS[variant], SIZES[size], className);
}

export function Button({
  variant,
  size,
  className,
  type = "button",
  ...props
}: ComponentProps<"button"> & ButtonStyle) {
  return <button type={type} className={buttonClass({ variant, size }, className)} {...props} />;
}
