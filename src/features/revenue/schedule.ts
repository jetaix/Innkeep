import { isISODate, type ISODate } from "@/lib/dates";
import { type Minor, parseMoney } from "@/lib/money";

/**
 * Reads a bank's amortisation table from pasted text or a CSV file. Banks do
 * not agree on a layout, so nothing is assumed about the order of the
 * columns: a heading names them when there is one, and otherwise the figures
 * themselves say which is which (the payment is interest plus capital, the
 * interest shrinks, what is still owed is the largest and only goes down).
 * Pure: text in, lines out.
 */
export type ScheduleLine = {
  date: ISODate;
  interest: Minor;
  capital: Minor;
  insurance: Minor;
  /** Capital still owed after the payment; null when the table has no such column. */
  remaining: Minor | null;
};

/** Why a table could not be read, for the page to explain. */
export type ScheduleProblem = "empty" | "columns";
export type ParsedSchedule = { ok: true; lines: ScheduleLine[] } | { ok: false; problem: ScheduleProblem };

const DATE = /\b(\d{4})-(\d{2})-(\d{2})\b|\b(\d{1,2})[/.-](\d{1,2})[/.-](\d{4}|\d{2})\b/;
// "1 196,21", "1.196,21", "1,196.21", "1196.21", "30": digits grouped by threes, then up to two decimals.
const AMOUNT = /-?\d{1,3}(?:[   .,]\d{3})+(?:[.,]\d{1,2})?(?!\d)|-?\d+(?:[.,]\d{1,2})?(?!\d)/g;

function dateOf(text: string): { date: ISODate; end: number } | null {
  const found = DATE.exec(text);
  if (!found) return null;
  const [year, month, day] = found[1]
    ? [found[1], found[2], found[3]]
    : [found[6].length === 2 ? `20${found[6]}` : found[6], found[5], found[4]];
  const date = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  return isISODate(date) ? { date, end: found.index + found[0].length } : null;
}

const plain = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

type Columns = { interest: number; capital: number; insurance?: number; remaining?: number };

/** The columns a heading names, counted among the cells that follow the date. */
function fromHeading(cells: string[], dateAt: number): Columns | null {
  const at = (pattern: RegExp, not?: RegExp) => {
    const index = cells.findIndex((cell, i) => i > dateAt && pattern.test(cell) && !not?.test(cell));
    return index === -1 ? undefined : index - dateAt - 1;
  };
  const remaining = at(/restant|crd|solde|balance|remaining|outstanding/);
  const interest = at(/inter/);
  const capital = at(/capital|amorti|principal/, /restant|crd|solde|balance|remaining|outstanding/);
  if (interest == null || capital == null) return null;
  return { interest, capital, insurance: at(/assur|insur/), remaining };
}

const near = (a: number, b: number) => Math.abs(a - b) <= 2;
const mostly = (rows: number[][], test: (row: number[]) => boolean) =>
  rows.filter(test).length >= Math.ceil(rows.length * 0.8);

/** The columns the figures themselves point to. */
function fromFigures(rows: number[][]): Columns | null {
  const width = rows[0].length;
  const all = Array.from({ length: width }, (_, i) => i);
  const first = rows[0];
  const last = rows[rows.length - 1];
  // What is still owed: larger than anything else on the first line, and it never goes up.
  const remaining = all.find(
    (c) =>
      all.every((other) => other === c || first[c] > first[other]) &&
      rows.every((row, i) => i === 0 || row[c] <= rows[i - 1][c]),
  );
  const rest = all.filter((c) => c !== remaining);
  // The part that shrinks from payment to payment is the interest.
  const split = (a: number, b: number) =>
    first[a] > last[a] || (first[a] === last[a] && first[a] === 0)
      ? { interest: a, capital: b }
      : { interest: b, capital: a };

  // A payment that is the sum of two other columns, or of three when it includes the insurance.
  for (const payment of rest) {
    const parts = rest.filter((c) => c !== payment);
    for (const a of parts) {
      for (const b of parts) {
        if (b <= a) continue;
        const others = parts.filter((c) => c !== a && c !== b);
        if (mostly(rows, (row) => near(row[payment], row[a] + row[b]))) {
          return { ...split(a, b), insurance: others[0], remaining };
        }
        for (const c of others) {
          if (!mostly(rows, (row) => near(row[payment], row[a] + row[b] + row[c]))) continue;
          // Of the three, the insurance is the one that barely moves.
          const spread = (column: number) => Math.abs(first[column] - last[column]);
          const [insurance, ...two] = [a, b, c].sort((x, y) => spread(x) - spread(y));
          return { ...split(two[0], two[1]), insurance, remaining };
        }
      }
    }
  }
  // No payment column: interest and capital alone, with or without the insurance.
  if (rest.length === 2) return { ...split(rest[0], rest[1]), remaining };
  return null;
}

export function parseSchedule(text: string): ParsedSchedule {
  const delimiter = [";", "\t", "|"].find((mark) => text.includes(mark));
  let heading: Columns | null = null;
  const rows: { date: ISODate; figures: number[] }[] = [];

  for (const line of text.split(/\r?\n/)) {
    const dated = dateOf(line);
    if (!dated) {
      // A line of words above the figures: the names of the columns.
      if (delimiter && rows.length === 0 && /inter/.test(plain(line))) {
        const cells = line.split(delimiter).map(plain);
        heading = fromHeading(
          cells,
          cells.findIndex((cell) => /date|echeance|due/.test(cell)),
        );
      }
      continue;
    }
    const after = line.slice(dated.end);
    const figures = (
      delimiter
        ? after
            .split(delimiter)
            .slice(1)
            .map((cell) => (cell.trim() === "" ? 0 : parseMoney(cell)))
        : (after.match(AMOUNT) ?? []).map((amount) => parseMoney(amount))
    ).filter((value): value is number => value != null);
    rows.push({ date: dated.date, figures });
  }
  if (rows.length === 0) return { ok: false, problem: "empty" };

  // Totals and notes carry a different number of figures: keep the lines shaped like most.
  const widths = new Map<number, number>();
  for (const row of rows) widths.set(row.figures.length, (widths.get(row.figures.length) ?? 0) + 1);
  const width = [...widths].sort((a, b) => b[1] - a[1])[0][0];
  const kept = rows.filter((row) => row.figures.length === width).sort((a, b) => (a.date < b.date ? -1 : 1));
  const usable = (columns: Columns | null): columns is Columns =>
    columns != null &&
    [columns.interest, columns.capital, columns.insurance ?? 0, columns.remaining ?? 0].every(
      (index) => index >= 0 && index < width,
    );
  const columns = usable(heading) ? heading : width >= 2 ? fromFigures(kept.map((row) => row.figures)) : null;
  if (!usable(columns)) return { ok: false, problem: "columns" };

  // Some banks print what is owed before each payment, not after: then a line's
  // balance less its capital is the next line's balance.
  const owed = (row: { figures: number[] }) => Math.abs(row.figures[columns.remaining ?? 0]);
  const paid = (row: { figures: number[] }) => Math.abs(row.figures[columns.capital]);
  const before =
    columns.remaining != null &&
    kept.length > 1 &&
    mostly(
      kept.slice(0, -1).map((_, index) => [index]),
      ([index]) => near(owed(kept[index]) - paid(kept[index]), owed(kept[index + 1])),
    );

  const lines = new Map<ISODate, ScheduleLine>();
  for (const row of kept) {
    const { date, figures } = row;
    lines.set(date, {
      date,
      interest: Math.abs(figures[columns.interest]),
      capital: Math.abs(figures[columns.capital]),
      insurance: columns.insurance == null ? 0 : Math.abs(figures[columns.insurance]),
      remaining: columns.remaining == null ? null : before ? Math.max(0, owed(row) - paid(row)) : owed(row),
    });
  }
  return { ok: true, lines: [...lines.values()] };
}
