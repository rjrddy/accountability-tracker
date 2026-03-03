import { afterEach, describe, expect, it, vi } from "vitest";
import type { GoalsByDate } from "@/lib/goalsStore";
import { getDayStatsRange, getLastNDaysStats, intensityBucket } from "@/lib/stats";

describe("stats helpers", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("generates continuous day stats including empty days", () => {
    const goalsByDate = {
      "2026-03-01": [
        { id: "a", text: "A", completed: true, createdAt: "2026-03-01T00:00:00.000Z" },
        { id: "b", text: "B", completed: false, createdAt: "2026-03-01T00:00:00.000Z" }
      ],
      "2026-03-03": [{ id: "c", text: "C", completed: true, createdAt: "2026-03-03T00:00:00.000Z" }]
    } satisfies GoalsByDate;

    const stats = getDayStatsRange("2026-03-01", "2026-03-03", goalsByDate);

    expect(stats).toEqual([
      { date: "2026-03-01", total: 2, completed: 1, rate: 50 },
      { date: "2026-03-02", total: 0, completed: 0, rate: 0 },
      { date: "2026-03-03", total: 1, completed: 1, rate: 100 }
    ]);
  });

  it("returns last N days ending today", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-10T15:00:00.000Z"));

    const goalsByDate = {
      "2026-03-08": [{ id: "a", text: "A", completed: true, createdAt: "2026-03-08T00:00:00.000Z" }]
    } satisfies GoalsByDate;

    const stats = getLastNDaysStats(3, goalsByDate);
    expect(stats.map((stat) => stat.date)).toEqual(["2026-03-08", "2026-03-09", "2026-03-10"]);
    expect(stats[0]?.completed).toBe(1);
    expect(stats[1]?.completed).toBe(0);
    expect(stats[2]?.completed).toBe(0);
  });

  it("maps completion counts to intensity buckets", () => {
    expect(intensityBucket({ date: "2026-03-01", total: 0, completed: 0, rate: 0 })).toBe(0);
    expect(intensityBucket({ date: "2026-03-01", total: 1, completed: 1, rate: 100 })).toBe(1);
    expect(intensityBucket({ date: "2026-03-01", total: 2, completed: 2, rate: 100 })).toBe(2);
    expect(intensityBucket({ date: "2026-03-01", total: 4, completed: 3, rate: 75 })).toBe(3);
    expect(intensityBucket({ date: "2026-03-01", total: 6, completed: 5, rate: 83 })).toBe(4);
  });
});
