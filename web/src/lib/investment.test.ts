import { describe, it, expect } from "vitest";
import { buildInvestmentSeries, totalContributed, InvestmentInputs } from "./investment";

const base: InvestmentInputs = {
  startTs: Date.UTC(2026, 0, 1),
  initialAmount: 1000,
  monthlyContribution: 0,
  annualRatePct: 12,
  horizonMonths: 12,
};

describe("buildInvestmentSeries", () => {
  it("starts at the initial amount", () => {
    const pts = buildInvestmentSeries(base);
    expect(pts[0].invested).toBeCloseTo(1000);
    expect(pts[0].t).toBe(base.startTs);
  });

  it("produces horizonMonths + 1 points", () => {
    expect(buildInvestmentSeries(base)).toHaveLength(13);
  });

  it("compounds a lump sum monthly (12% => 1% per month)", () => {
    const pts = buildInvestmentSeries(base);
    // 1000 * 1.01^12 ≈ 1126.83
    expect(pts[12].invested).toBeCloseTo(1000 * Math.pow(1.01, 12), 2);
  });

  it("adds monthly contributions on top of a zero starting balance", () => {
    const pts = buildInvestmentSeries({
      ...base,
      initialAmount: 0,
      monthlyContribution: 100,
      annualRatePct: 0,
    });
    // No growth, 12 contributions of 100.
    expect(pts[12].invested).toBeCloseTo(1200);
  });
});

describe("totalContributed", () => {
  it("sums initial plus all monthly contributions", () => {
    expect(totalContributed({ ...base, monthlyContribution: 100 })).toBe(1000 + 100 * 12);
  });
});
