import { useId } from "react";
import { cn } from "@/lib/cn";

/** One arch of the mark: a doorway, drawn from `x` to `x + 11`. */
const arch = (x: number) =>
  `M${x + 1.5} 21a1.5 1.5 0 0 1-1.5-1.5V8.5a5.5 5.5 0 0 1 11 0v11a1.5 1.5 0 0 1-1.5 1.5Z`;

export const MARK = { left: arch(2.5), right: arch(10.5) } as const;

/**
 * The mark: two doorways that overlap, one per calendar, darker where they
 * meet. In `ink` it inherits the text colour, so it stays monochrome inside
 * the dashboard; in `color` it uses the brand glass colours of the public pages.
 */
export function LogoMark({ className, tone = "ink" }: { className?: string; tone?: "ink" | "color" }) {
  const clip = useId();
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("size-5", className)}>
      {tone === "ink" ? (
        <g fill="currentColor">
          <path d={MARK.left} opacity="0.5" />
          <path d={MARK.right} opacity="0.5" />
          <clipPath id={clip}>
            <path d={MARK.left} />
          </clipPath>
          <path d={MARK.right} clipPath={`url(#${clip})`} />
        </g>
      ) : (
        <>
          <path d={MARK.left} fill="var(--glass-coral)" />
          <path d={MARK.right} fill="var(--glass-blue)" />
          <clipPath id={clip}>
            <path d={MARK.left} />
          </clipPath>
          <path d={MARK.right} clipPath={`url(#${clip})`} fill="var(--overlap)" />
        </>
      )}
    </svg>
  );
}

export function Logo({ className, tone }: { className?: string; tone?: "ink" | "color" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 tracking-tight",
        tone === "color" ? "font-display text-[19px] font-medium" : "text-[15px] font-semibold",
        className,
      )}
    >
      <LogoMark tone={tone} />
      Innkeep
    </span>
  );
}
