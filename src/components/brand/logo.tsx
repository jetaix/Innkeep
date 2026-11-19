import { cn } from "@/lib/cn";

/** The mark: a doorway in a solid block. Inherits the text colour. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("size-5", className)}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M5 2h14a3 3 0 0 1 3 3v14a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3Zm3 20v-9a4 4 0 0 1 8 0v9H8Zm5.6-6.4a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
      />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center gap-2 text-[15px] font-semibold tracking-tight", className)}
    >
      <LogoMark />
      Innkeep
    </span>
  );
}
