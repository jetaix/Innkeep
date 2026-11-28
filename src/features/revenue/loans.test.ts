import { describe, expect, it } from "vitest";
import { summariseMonth } from "./compute";
import { balanceAfter, loanCosts, loanState, monthlyCost, monthlyPayment } from "./loans";

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

describe("a loan with its bank's table", () => {
  const schedule = [
    { date: "2026-01-05", interest: 0, capital: 0, insurance: 30_00, remaining: 200_000_00 },
    { date: "2026-02-05", interest: 641_67, capital: 554_54, insurance: 30_00, remaining: 199_445_46 },
    { date: "2026-03-05", interest: 639_89, capital: 556_32, insurance: 32_00, remaining: null },
  ];
  const rates = [{ id: 1, basePrice: 100 }];

  it("costs each month what the table says, not the computed payment", () => {
    const costs = loanCosts([{ ...loan, schedule }]);
    expect(summariseMonth("2026-01", [], costs, rates).charges).toBe(30_00);
    expect(summariseMonth("2026-03", [], costs, rates).charges).toBe(639_89 + 556_32 + 32_00);
    expect(summariseMonth("2026-04", [], costs, rates).charges).toBe(0);
  });

  it("keeps the computed payment for the months before the table starts", () => {
    const late = schedule.map((line) => ({ ...line, date: line.date.replace("2026", "2027") }));
    const costs = loanCosts([{ ...loan, schedule: late }]);
    expect(summariseMonth("2026-12", [], costs, rates).charges).toBe(1_226_21);
    expect(summariseMonth("2027-01", [], costs, rates).charges).toBe(30_00);
    expect(summariseMonth("2027-04", [], costs, rates).charges).toBe(0);
  });

  it("stands where the table says", () => {
    expect(loanState(loan, "2026-02-10", schedule)).toMatchObject({
      total: 3,
      paid: 2,
      remaining: 199_445_46,
      interestNow: 641_67,
      capitalNow: 554_54,
      monthlyCost: 1_226_21,
      lastMonth: "2026-03",
      finished: false,
    });
    // No balance on the last line: what the capital paid leaves.
    expect(loanState(loan, "2026-03-05", schedule)).toMatchObject({
      finished: true,
      remaining: 200_000_00 - 554_54 - 556_32,
      cost: 641_67 + 639_89 + 92_00,
    });
  });
});

describe("a payment the borrower typed", () => {
  const terms = { principal: 20_000_000, rate: 385, months: 240, insurance: 3_000, startsOn: "2024-01-05" };

  it("is what the loan costs each month, insurance included", () => {
    const loan = { ...terms, payment: 125_000 };
    expect(monthlyCost(loan)).toBe(125_000);
    expect(loanState(loan, "2024-06-10").monthlyCost).toBe(125_000);
    expect(loanCosts([{ ...loan, id: 1, propertyId: null, label: "Mortgage" }])[0].amount).toBe(125_000);
  });

  it("leaves a loan entered without it on its computed payment", () => {
    expect(monthlyCost({ ...terms, payment: null })).toBe(monthlyPayment(terms) + 3_000);
  });

  it("repays the capital with the payment less its insurance", () => {
    const state = loanState({ ...terms, payment: 125_000 }, "2024-01-10");
    expect(state.payment).toBe(122_000);
    // One payment made: a month of interest on the whole amount, the rest off the capital.
    expect(state.remaining).toBe(Math.round(20_000_000 * (1 + 0.0385 / 12) - 122_000));
  });
});
