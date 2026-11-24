import { cn } from "@/lib/cn";

const PILL = {
  primary: "bg-ink text-inverse hover:bg-[color-mix(in_oklab,var(--ink)_86%,var(--overlap))]",
  secondary:
    "bg-panel text-ink shadow-[0_0_0_1px_var(--line),0_8px_20px_-14px_rgb(0_0_0/0.4)] hover:shadow-[0_0_0_1px_var(--line-strong),0_10px_22px_-14px_rgb(0_0_0/0.5)]",
} as const;

/** The public pages' button: a pill, in the two weights the pages use. */
export function pillClass(variant: keyof typeof PILL = "secondary", size: "md" | "lg" = "md") {
  return cn(
    "inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full font-medium whitespace-nowrap transition-[background-color,box-shadow,scale] duration-200 select-none active:scale-[0.97]",
    size === "lg" ? "h-12 px-6 text-[15px]" : "h-9 px-4 text-[13px]",
    PILL[variant],
  );
}
