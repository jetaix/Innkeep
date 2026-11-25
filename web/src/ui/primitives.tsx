import * as stylex from "@stylexjs/stylex";
import type { ComponentProps, ReactNode } from "react";
import type { Source } from "@/db/schema";
import { useI18n } from "../i18n";
import { color, font, radius, shadow, text } from "../tokens.stylex";

type Styled<T> = Omit<T, "className" | "style"> & { xstyle?: stylex.StyleXStyles };

const styles = stylex.create({
  // Product material sits on a panel that floats just above the ground.
  card: {
    borderRadius: radius.lg,
    backgroundColor: color.panel,
    boxShadow: shadow.card,
  },
  sectionTitle: { margin: 0, color: color.ink, fontSize: text.md, fontWeight: 600, letterSpacing: "-0.01em" },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.375rem",
    height: "1.25rem",
    paddingInline: "0.5rem",
    borderWidth: 1,
    borderStyle: "solid",
    borderRadius: radius.full,
    fontSize: text.xs,
    fontWeight: 500,
    whiteSpace: "nowrap",
  },
  dot: {
    flexShrink: 0,
    width: "0.5rem",
    height: "0.5rem",
    borderRadius: radius.full,
    boxShadow: `inset 0 1px 0 ${color.glassHi}`,
  },
  kbd: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    height: 18,
    minWidth: 18,
    paddingInline: "0.25rem",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: color.lineStrong,
    borderRadius: radius.sm,
    backgroundColor: color.subtle,
    color: color.muted,
    fontFamily: "inherit",
    fontVariantNumeric: "tabular-nums",
    fontSize: text.xs,
    fontWeight: 500,
  },
  header: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "flex-end",
    justifyContent: "space-between",
    columnGap: "1.5rem",
    rowGap: "0.75rem",
    marginBottom: "1.75rem",
  },
  headerText: { minWidth: 0 },
  // The display face at regular weight: size carries the hierarchy, never bold.
  pageTitle: {
    margin: 0,
    fontFamily: font.display,
    fontSize: text.title,
    fontWeight: 400,
    letterSpacing: "-0.025em",
    lineHeight: 1.15,
    textWrap: "balance",
  },
  description: {
    maxWidth: "44rem",
    margin: "0.375rem 0 0",
    color: color.muted,
    fontSize: text.md,
    lineHeight: 1.55,
    textWrap: "pretty",
  },
  row: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem" },
  empty: { maxWidth: "36rem", padding: "1.5rem" },
  emptyTitle: {
    margin: 0,
    fontFamily: font.display,
    fontSize: "1.375rem",
    fontWeight: 400,
    letterSpacing: "-0.02em",
    lineHeight: 1.25,
  },
  emptyBody: { marginTop: "0.375rem", color: color.muted, fontSize: text.base, lineHeight: 1.625 },
  emptyAction: { display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "1rem" },
  notice: { margin: 0, padding: "0.5rem 0.75rem", borderRadius: radius.field, fontSize: text.base },
  status: { margin: 0, paddingBlock: "2.5rem", color: color.muted, fontSize: text.base },
  // Present for a screen reader, absent from the picture.
  hidden: {
    position: "absolute",
    width: 1,
    height: 1,
    margin: -1,
    padding: 0,
    overflow: "hidden",
    clipPath: "inset(50%)",
    whiteSpace: "nowrap",
    borderWidth: 0,
  },
});

const tones = stylex.create({
  neutral: { borderColor: color.line, color: color.muted },
  good: {
    borderColor: "transparent",
    backgroundColor: `color-mix(in oklab, ${color.good} 10%, transparent)`,
    color: color.good,
  },
  warn: { borderColor: "transparent", backgroundColor: color.warnBg, color: color.warn },
  critical: { borderColor: "transparent", backgroundColor: color.criticalBg, color: color.critical },
  // Two stays on the same night.
  clash: { borderColor: "transparent", backgroundColor: color.clashBg, color: color.clash },
});

const sources = stylex.create({
  airbnb: { backgroundColor: color.airbnb },
  booking: { backgroundColor: color.booking },
  direct: { backgroundColor: color.direct },
});

export function Card({ xstyle, ...props }: Styled<ComponentProps<"div">>) {
  return <div {...props} {...stylex.props(styles.card, xstyle)} />;
}

export function SectionTitle({ xstyle, ...props }: Styled<ComponentProps<"h2">>) {
  return <h2 {...props} {...stylex.props(styles.sectionTitle, xstyle)} />;
}

export function Badge({
  tone = "neutral",
  xstyle,
  ...props
}: Styled<ComponentProps<"span">> & { tone?: keyof typeof tones }) {
  return <span {...props} {...stylex.props(styles.badge, tones[tone], xstyle)} />;
}

export function SourceDot({ source, xstyle }: { source: Source; xstyle?: stylex.StyleXStyles }) {
  return <span aria-hidden {...stylex.props(styles.dot, sources[source], xstyle)} />;
}

/** Channel name with its colour dot. The name is always written out, never colour alone. */
export function SourceBadge({ source }: { source: Source }) {
  const { m } = useI18n();
  return (
    <Badge>
      <SourceDot source={source} />
      {m.common.sources[source]}
    </Badge>
  );
}

export function Kbd({ xstyle, ...props }: Styled<ComponentProps<"kbd">>) {
  return <kbd {...props} {...stylex.props(styles.kbd, xstyle)} />;
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
    <header {...stylex.props(styles.header)}>
      <div {...stylex.props(styles.headerText)}>
        <h1 {...stylex.props(styles.pageTitle)}>{title}</h1>
        {description && <p {...stylex.props(styles.description)}>{description}</p>}
      </div>
      {children && <div {...stylex.props(styles.row)}>{children}</div>}
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
    <Card xstyle={styles.empty}>
      <h2 {...stylex.props(styles.emptyTitle)}>{title}</h2>
      <div {...stylex.props(styles.emptyBody)}>{children}</div>
      {action && <div {...stylex.props(styles.emptyAction)}>{action}</div>}
    </Card>
  );
}

export function Notice({
  tone,
  xstyle,
  ...props
}: Styled<ComponentProps<"p">> & { tone: "warn" | "critical" | "clash" }) {
  return <p {...props} {...stylex.props(styles.notice, tones[tone], xstyle)} />;
}

/** Placeholder while a section reads its data. */
export function Loading() {
  const { m } = useI18n();
  return (
    <p role="status" {...stylex.props(styles.status)}>
      {m.common.loading}
    </p>
  );
}

/** Text for a screen reader only. */
export function Hidden({ children }: { children: ReactNode }) {
  return <span {...stylex.props(styles.hidden)}>{children}</span>;
}
