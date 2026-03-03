import type { GoalsByDate } from "@/lib/goalsStore";

export type DayStat = {
  date: string;
  total: number;
  completed: number;
  rate: number;
};

function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toDateKey(date: Date): string {
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().split("T")[0];
}

function shiftDateKey(dateKey: string, days: number): string {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

function buildDayStat(dateKey: string, goalsByDate: GoalsByDate): DayStat {
  const goals = goalsByDate[dateKey] ?? [];
  const total = goals.length;
  const completed = goals.filter((goal) => goal.completed).length;
  const rate = total === 0 ? 0 : Math.round((completed / total) * 100);

  return {
    date: dateKey,
    total,
    completed,
    rate
  };
}

export function getDayStatsRange(startDate: string, endDate: string, goalsByDate: GoalsByDate): DayStat[] {
  const start = parseDateKey(startDate);
  const end = parseDateKey(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    return [];
  }

  const results: DayStat[] = [];
  let currentKey = startDate;

  while (parseDateKey(currentKey) <= end) {
    results.push(buildDayStat(currentKey, goalsByDate));
    currentKey = shiftDateKey(currentKey, 1);
  }

  return results;
}

export function getLastNDaysStats(n: number, goalsByDate: GoalsByDate): DayStat[] {
  if (n <= 0) {
    return [];
  }

  const endDate = toDateKey(new Date());
  const startDate = shiftDateKey(endDate, -(n - 1));
  return getDayStatsRange(startDate, endDate, goalsByDate);
}

export function intensityBucket(stat: DayStat): 0 | 1 | 2 | 3 | 4 {
  if (stat.completed <= 0) {
    return 0;
  }

  if (stat.completed === 1) {
    return 1;
  }

  if (stat.completed === 2) {
    return 2;
  }

  if (stat.completed <= 4) {
    return 3;
  }

  return 4;
}
