import { describe, it, expect } from "vitest";
import { linearFit, buildSavingsPoints, Snapshot } from "./savingsService";

const day = (iso: string): Date => new Date(`${iso}T00:00:00.000Z`);

describe("linearFit", () => {
  it("fits a perfect upward line", () => {
    const { slope, intercept } = linearFit([0, 1, 2, 3], [10, 20, 30, 40]);
    expect(slope).toBeCloseTo(10);
    expect(intercept).toBeCloseTo(10);
  });

  it("returns a flat line at the mean when there is no x-spread", () => {
    const { slope, intercept } = linearFit([5, 5, 5], [2, 4, 6]);
    expect(slope).toBe(0);
    expect(intercept).toBeCloseTo(4);
  });
});

describe("buildSavingsPoints", () => {
  it("returns only actual points (no projection) with a single snapshot", () => {
    const snaps: Snapshot[] = [{ date: day("2026-01-01"), totalSavings: 1000 }];
    const points = buildSavingsPoints(snaps, 3);
    expect(points).toHaveLength(1);
    expect(points[0]).toMatchObject({ date: "2026-01-01", actual: 1000, projected: null });
  });

  it("projects a linear upward trend from a rising history", () => {
    // +100/day over 10 days.
    const snaps: Snapshot[] = Array.from({ length: 11 }, (_, i) => ({
      date: new Date(day("2026-01-01").getTime() + i * 86400000),
      totalSavings: 1000 + i * 100,
    }));

    const points = buildSavingsPoints(snaps, 3);
    const actuals = points.filter((p) => p.actual != null);
    const projected = points.filter((p) => p.projected != null);

    // 11 actual points preserved.
    expect(actuals).toHaveLength(11);
    // Projection anchored at last actual value (2000) for continuity.
    expect(actuals[actuals.length - 1].projected).toBeCloseTo(2000);
    // Future projections extend upward beyond the last actual.
    const future = projected.filter((p) => p.actual == null);
    expect(future.length).toBeGreaterThan(0);
    const last = future[future.length - 1];
    // ~90 days out at +100/day from day 10 => roughly 2000 + 90*100.
    expect(last.projected!).toBeGreaterThan(2000);
  });
});
