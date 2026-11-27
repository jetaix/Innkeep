import { describe, expect, it } from "vitest";
import { parseSchedule } from "./schedule";

const lines = (text: string) => {
  const parsed = parseSchedule(text);
  if (!parsed.ok) throw new Error(parsed.problem);
  return parsed.lines;
};

describe("parseSchedule", () => {
  it("reads a table pasted from a French bank's PDF, whatever the order of the columns", () => {
    const pasted = `
      N° Date Échéance Intérêts Capital amorti Assurance Capital restant dû
      1 05/01/2026 1 196,21 641,67 554,54 30,00 199 445,46
      2 05/02/2026 1 196,21 639,89 556,32 30,00 198 889,14
      3 05/03/2026 1 196,21 638,10 558,11 30,00 198 331,03
      Total 3 588,63 1 919,66 1 668,97 90,00
    `;
    expect(lines(pasted)).toEqual([
      { date: "2026-01-05", interest: 641_67, capital: 554_54, insurance: 30_00, remaining: 199_445_46 },
      { date: "2026-02-05", interest: 639_89, capital: 556_32, insurance: 30_00, remaining: 198_889_14 },
      { date: "2026-03-05", interest: 638_10, capital: 558_11, insurance: 30_00, remaining: 198_331_03 },
    ]);
  });

  it("tells interest from capital by which one shrinks", () => {
    // Capital before interest, the balance first, no insurance.
    const pasted = `
      2026-01-05  199 445,46  554,54  641,67  1 196,21
      2026-02-05  198 889,14  556,32  639,89  1 196,21
    `;
    expect(lines(pasted)[0]).toEqual({
      date: "2026-01-05",
      interest: 641_67,
      capital: 554_54,
      insurance: 0,
      remaining: 199_445_46,
    });
  });

  it("finds the insurance inside a payment that includes it", () => {
    const pasted = `
      05/01/2026 1 226,21 554,54 641,67 30,00 199 445,46
      05/02/2026 1 226,21 556,32 639,89 30,00 198 889,14
    `;
    expect(lines(pasted)[1]).toMatchObject({ interest: 639_89, capital: 556_32, insurance: 30_00 });
  });

  it("follows the heading of a CSV file", () => {
    const csv = [
      "Date;Capital restant;Assurance;Intérêts;Amortissement;Mensualité",
      "05/01/2026;199445.46;30;641.67;554.54;1226.21",
      "05/02/2026;198889.14;30;639.89;556.32;1226.21",
    ].join("\n");
    expect(lines(csv)).toEqual([
      { date: "2026-01-05", interest: 641_67, capital: 554_54, insurance: 30_00, remaining: 199_445_46 },
      { date: "2026-02-05", interest: 639_89, capital: 556_32, insurance: 30_00, remaining: 198_889_14 },
    ]);
  });

  it("says what is wrong instead of guessing", () => {
    expect(parseSchedule("nothing to see here")).toEqual({ ok: false, problem: "empty" });
    expect(parseSchedule("05/01/2026 1 196,21\n05/02/2026 1 196,21")).toEqual({
      ok: false,
      problem: "columns",
    });
  });
});
