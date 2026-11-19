/** Money is stored as integers in minor units (cents) to avoid float drift. */
export type Minor = number;

export function formatMoney(
  amount: Minor,
  currency: string,
  options: { cents?: boolean } = {},
  locale = "en-GB",
): string {
  const showCents = options.cents ?? amount % 100 !== 0;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: showCents ? 2 : 0,
    maximumFractionDigits: showCents ? 2 : 0,
  }).format(amount / 100);
}

/** Parses "1 250,50", "1250.5" or "1,250.50" into minor units. Returns null when not a number. */
export function parseMoney(input: string): Minor | null {
  const cleaned = input.replace(/[^\d.,-]/g, "");
  if (!cleaned) return null;
  // The last separator is the decimal mark; earlier ones group thousands.
  const lastSeparator = Math.max(cleaned.lastIndexOf("."), cleaned.lastIndexOf(","));
  const hasDecimals = lastSeparator !== -1 && cleaned.length - lastSeparator - 1 <= 2;
  const normalised = hasDecimals
    ? `${cleaned.slice(0, lastSeparator).replace(/[.,]/g, "")}.${cleaned.slice(lastSeparator + 1)}`
    : cleaned.replace(/[.,]/g, "");
  const value = Number(normalised);
  return Number.isFinite(value) ? Math.round(value * 100) : null;
}

export function formatPercent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}
