import type { ComponentProps, ReactNode } from "react";
import { sourceLabel } from "@/channels";
import type { Source } from "@/db/schema";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("rounded-lg border border-line bg-bg", className)} {...props} />;
}

export function SectionTitle({ className, ...props }: ComponentProps<"h2">) {
  return <h2 className={cn("text-[13px] font-semibold text-ink", className)} {...props} />;
}

const BADGE_TONES = {
  neutral: "border-line text-muted",
  good: "border-transparent bg-good/10 text-good",
  warn: "border-transparent bg-warn-bg text-warn",
  critical: "border-transparent bg-critical-bg text-critical",
} as const;

export function Badge({
  tone = "neutral",
  className,
  ...props
}: ComponentProps<"span"> & { tone?: keyof typeof BADGE_TONES }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-1.5 rounded-full border px-2 text-[11px] font-medium whitespace-nowrap",
        BADGE_TONES[tone],
        className,
      )}
      {...props}
    />
  );
}

export const SOURCE_DOT: Record<Source, string> = {
  airbnb: "bg-airbnb",
  booking: "bg-booking",
  direct: "bg-direct",
};

export function SourceDot({ source, className }: { source: Source; className?: string }) {
  return <span aria-hidden className={cn("size-2 shrink-0 rounded-full", SOURCE_DOT[source], className)} />;
}

/** Channel name with its colour dot. The name is always written out, never colour alone. */
export function SourceBadge({ source }: { source: Source }) {
  return (
    <Badge>
      <SourceDot source={source} />
      {sourceLabel(source)}
    </Badge>
  );
}

export function Kbd({ className, ...props }: ComponentProps<"kbd">) {
  return (
    <kbd
      className={cn(
        "inline-flex h-[18px] min-w-[18px] items-center justify-center rounded border border-line-strong bg-subtle px-1 font-sans text-[11px] font-medium text-muted",
        className,
      )}
      {...props}
    />
  );
}

export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-0.5 text-[13px] text-muted">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </header>
  );
}

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <Card className="max-w-xl p-6">
      <h2 className="text-sm font-semibold">{title}</h2>
      <div className="mt-1.5 text-[13px] leading-relaxed text-muted">{children}</div>
      {action && <div className="mt-4 flex flex-wrap gap-2">{action}</div>}
    </Card>
  );
}

export function Notice({ tone, className, ...props }: ComponentProps<"p"> & { tone: "warn" | "critical" }) {
  return (
    <p
      className={cn(
        "rounded-md px-3 py-2 text-[13px]",
        tone === "warn" ? "bg-warn-bg text-warn" : "bg-critical-bg text-critical",
        className,
      )}
      {...props}
    />
  );
}
