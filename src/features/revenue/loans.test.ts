import { describe, expect, it } from "vitest";
import { summariseMonth } from "./compute";
import { balanceAfter, loanCosts, loanState, monthlyPayment } from "./loans";

// 200 000 over 20 years at 3.85%: 1 196.21 a month.
const loan = {
  id: 1,
  propertyId: null,
  label: "Mortgage",
  principal: 200_000_00,
  rate: 385,
  months: 240,
  insurance: 30_00,
  startsOn: "2026-01-05",
};

describe("monthlyPayment", () => {
  it("is the annuity payment", () => {
    expect(monthlyPayment(loan)).toBe(1_196_21);
  });

  it("divides the capital when the rate is zero", () => {
    expect(monthlyPayment({ principal: 12_000_00, rate: 0, months: 12 })).toBe(1_000_00);
  });
});

describe("balanceAfter", () => {
  it("goes from the capital to nothing", () => {
    expect(balanceAfter(loan, 0)).toBe(200_000_00);
    expect(balanceAfter(loan, 240)).toBe(0);
    // After one payment: 200 000 + 641.67 of interest − 1 196.21.
    expect(balanceAfter(loan, 1)).toBeCloseTo(199_445_46, -2);
  });
});

describe("loanState", () => {
  it("counts a payment from its day in the month", () => {
    expect(loanState(loan, "2026-01-04").paid).toBe(0);
    expect(loanState(loan, "2026-01-05").paid).toBe(1);
    expect(loanState(loan, "2026-11-27").paid).toBe(11);
  });

  it("splits this month's payment into interest and capital", () => {
    const state = loanState(loan, "2026-01-10");
    expect(state.interestNow).toBe(641_67);
    expect(state.capitalNow).toBe(1_196_21 - 641_67);
    expect(state.monthlyCost).toBe(1_226_21);
  });

  it("ends with the last payment", () => {
    expect(loanState(loan, "2045-12-04").finished).toBe(false);
    const done = loanState(loan, "2045-12-05");
    expect(done).toMatchObject({ finished: true, remaining: 0, lastMonth: "2045-12" });
    expect(done.interest).toBe(1_196_21 * 240 - 200_000_00);
    expect(loanState(loan, "2046-01-10").interestNow).toBe(0);
  });
});

describe("loanCosts", () => {
  const rates = [{ id: 1, basePrice: 100 }];
  const costs = loanCosts([loan]);

  it("is a cost of every month from the first payment to the last", () => {
    expect(summariseMonth("2025-12", [], costs, rates).charges).toBe(0);
    expect(summariseMonth("2026-01", [], costs, rates).charges).toBe(1_226_21);
    expect(summariseMonth("2045-12", [], costs, rates).charges).toBe(1_226_21);
    expect(summariseMonth("2046-01", [], costs, rates).charges).toBe(0);
  });

  it("is filed as a loan, apart from the charges", () => {
    expect(summariseMonth("2026-03", [], costs, rates).chargeLines).toEqual([
      { id: -1, label: "Mortgage", category: "loan", amount: 1_226_21 },
    ]);
  });
});
