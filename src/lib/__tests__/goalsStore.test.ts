import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  STORAGE_KEY,
  addGoal,
  clearCompleted,
  deleteGoal,
  getGoalsForDate,
  getProgress,
  getStorageKey,
  loadGoalsByDate,
  saveGoalsByDate,
  toggleGoalCompleted,
  updateGoalText,
  type GoalsByDate
} from "@/lib/goalsStore";

class MemoryStorage implements Storage {
  private data = new Map<string, string>();

  get length(): number {
    return this.data.size;
  }

  clear(): void {
    this.data.clear();
  }

  getItem(key: string): string | null {
    return this.data.has(key) ? this.data.get(key) ?? null : null;
  }

  key(index: number): string | null {
    const keys = [...this.data.keys()];
    return keys[index] ?? null;
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

describe("goalsStore", () => {
  const storage = new MemoryStorage();

  beforeEach(() => {
    storage.clear();
    vi.stubGlobal("window", {
      localStorage: storage
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("adds goals to a selected date", () => {
    const initial: GoalsByDate = {};
    const next = addGoal(initial, "2026-03-03", { text: "Ship MVP" });

    const goals = getGoalsForDate(next, "2026-03-03");
    expect(goals).toHaveLength(1);
    expect(goals[0]?.text).toBe("Ship MVP");
    expect(goals[0]?.completed).toBe(false);
  });

  it("updates goal text", () => {
    const state = {
      "2026-03-03": [
        {
          id: "g1",
          text: "Old",
          completed: false,
          createdAt: "2026-03-03T00:00:00.000Z"
        }
      ]
    } satisfies GoalsByDate;

    const next = updateGoalText(state, "2026-03-03", "g1", "New text");
    expect(next["2026-03-03"]?.[0]?.text).toBe("New text");
  });

  it("toggles and clears completed goals", () => {
    const state = {
      "2026-03-03": [
        {
          id: "g1",
          text: "A",
          completed: false,
          createdAt: "2026-03-03T00:00:00.000Z"
        },
        {
          id: "g2",
          text: "B",
          completed: true,
          createdAt: "2026-03-03T00:00:00.000Z"
        }
      ]
    } satisfies GoalsByDate;

    const toggled = toggleGoalCompleted(state, "2026-03-03", "g1");
    expect(toggled["2026-03-03"]?.find((goal) => goal.id === "g1")?.completed).toBe(true);

    const cleared = clearCompleted(toggled, "2026-03-03");
    expect(cleared["2026-03-03"]).toHaveLength(0);
  });

  it("deletes goals", () => {
    const state = {
      "2026-03-03": [
        {
          id: "g1",
          text: "A",
          completed: false,
          createdAt: "2026-03-03T00:00:00.000Z"
        }
      ]
    } satisfies GoalsByDate;

    const next = deleteGoal(state, "2026-03-03", "g1");
    expect(next["2026-03-03"]).toHaveLength(0);
  });

  it("loads and saves from localStorage", () => {
    const state = {
      "2026-03-03": [
        {
          id: "g1",
          text: "Persisted",
          completed: false,
          createdAt: "2026-03-03T00:00:00.000Z"
        }
      ]
    } satisfies GoalsByDate;

    saveGoalsByDate(state);
    const loaded = loadGoalsByDate();

    expect(loaded).toEqual(state);
    expect(storage.getItem(STORAGE_KEY)).not.toBeNull();
  });

  it("returns progress summary", () => {
    const goals = [
      { id: "a", text: "A", completed: true, createdAt: "2026-03-03T00:00:00.000Z" },
      { id: "b", text: "B", completed: false, createdAt: "2026-03-03T00:00:00.000Z" },
      { id: "c", text: "C", completed: true, createdAt: "2026-03-03T00:00:00.000Z" }
    ];

    expect(getProgress(goals)).toEqual({ completed: 2, total: 3, percentage: 67 });
  });

  it("builds scoped storage keys for auth and guest", () => {
    expect(getStorageKey("abc123")).toBe("goals:abc123");
    expect(getStorageKey(null)).toBe("goals:guest");
    expect(getStorageKey(undefined)).toBe("goals:guest");
  });
});
