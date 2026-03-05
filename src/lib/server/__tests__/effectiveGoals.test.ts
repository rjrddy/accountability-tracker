import { describe, expect, it } from "vitest";
import { resolveEffectiveGoalsForDate } from "@/lib/server/effectiveGoals";

describe("resolveEffectiveGoalsForDate", () => {
  it("applies skip and text override for recurring occurrences", () => {
    const date = "2026-03-05";

    const resolved = resolveEffectiveGoalsForDate({
      date,
      oneTimeGoals: [],
      series: [
        {
          id: "series-1",
          uid: "u1",
          text: "Run 5k",
          recurrenceType: "DAILY",
          interval: 1,
          daysOfWeek: [],
          dayOfMonth: null,
          startDate: "2026-03-01",
          endDate: null,
          createdAt: new Date("2026-03-01T00:00:00.000Z")
        },
        {
          id: "series-2",
          uid: "u1",
          text: "Read 20 pages",
          recurrenceType: "DAILY",
          interval: 1,
          daysOfWeek: [],
          dayOfMonth: null,
          startDate: "2026-03-01",
          endDate: null,
          createdAt: new Date("2026-03-01T00:00:00.000Z")
        }
      ],
      overrides: [
        {
          seriesId: "series-1",
          date,
          overrideText: "Run 10k",
          isSkipped: false
        },
        {
          seriesId: "series-2",
          date,
          overrideText: null,
          isSkipped: true
        }
      ],
      completions: []
    });

    expect(resolved).toHaveLength(1);
    expect(resolved[0]?.text).toBe("Run 10k");
    expect(resolved[0]?.isOverride).toBe(true);
  });

  it("applies completion per-date for recurring goals", () => {
    const date = "2026-03-05";

    const resolved = resolveEffectiveGoalsForDate({
      date,
      oneTimeGoals: [],
      series: [
        {
          id: "series-1",
          uid: "u1",
          text: "Meditate",
          recurrenceType: "DAILY",
          interval: 1,
          daysOfWeek: [],
          dayOfMonth: null,
          startDate: "2026-03-01",
          endDate: null,
          createdAt: new Date("2026-03-01T00:00:00.000Z")
        }
      ],
      overrides: [],
      completions: [
        {
          seriesId: "series-1",
          date,
          completed: true,
          completedAt: new Date("2026-03-05T10:00:00.000Z")
        }
      ]
    });

    expect(resolved[0]?.completed).toBe(true);
    expect(resolved[0]?.completedAt).toBe(new Date("2026-03-05T10:00:00.000Z").getTime());
  });
});
