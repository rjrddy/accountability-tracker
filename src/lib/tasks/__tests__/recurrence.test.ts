import { describe, expect, it } from "vitest";
import { isSeriesActiveForDate } from "@/lib/tasks/recurrence";

describe("recurrence matching", () => {
  it("matches daily recurrence for every day on and after startDate", () => {
    const series = {
      recurrenceType: "DAILY" as const,
      interval: 1,
      daysOfWeek: [],
      dayOfMonth: null,
      startDate: "2026-03-01",
      endDate: null
    };

    expect(isSeriesActiveForDate(series, "2026-02-28")).toBe(false);
    expect(isSeriesActiveForDate(series, "2026-03-01")).toBe(true);
    expect(isSeriesActiveForDate(series, "2026-03-02")).toBe(true);
    expect(isSeriesActiveForDate(series, "2026-03-15")).toBe(true);
  });

  it("matches weekly recurrence based on selected weekdays", () => {
    const series = {
      recurrenceType: "WEEKLY" as const,
      interval: 1,
      daysOfWeek: [1, 3, 5],
      dayOfMonth: null,
      startDate: "2026-03-01",
      endDate: null
    };

    expect(isSeriesActiveForDate(series, "2026-03-02")).toBe(true); // Monday
    expect(isSeriesActiveForDate(series, "2026-03-03")).toBe(false); // Tuesday
    expect(isSeriesActiveForDate(series, "2026-03-04")).toBe(true); // Wednesday
  });

  it("matches monthly recurrence by dayOfMonth and skips months without that day", () => {
    const series = {
      recurrenceType: "MONTHLY" as const,
      interval: 1,
      daysOfWeek: [],
      dayOfMonth: 31,
      startDate: "2026-01-31",
      endDate: null
    };

    expect(isSeriesActiveForDate(series, "2026-02-28")).toBe(false);
    expect(isSeriesActiveForDate(series, "2026-03-31")).toBe(true);
    expect(isSeriesActiveForDate(series, "2026-04-30")).toBe(false);
  });
});
