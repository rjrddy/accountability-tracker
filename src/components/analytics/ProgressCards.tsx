"use client";

import { useMemo } from "react";
import type { GoalsByDate } from "@/lib/goalsStore";
import { getLastNDaysStats } from "@/lib/stats";

type ProgressCardsProps = {
  goalsByDate: GoalsByDate;
};

function getCurrentStreak(stats: ReturnType<typeof getLastNDaysStats>): number {
  let streak = 0;
  for (let i = stats.length - 1; i >= 0; i -= 1) {
    if ((stats[i]?.completed ?? 0) <= 0) {
      break;
    }
    streak += 1;
  }
  return streak;
}

export default function ProgressCards({ goalsByDate }: ProgressCardsProps) {
  const allStats = useMemo(() => getLastNDaysStats(365, goalsByDate), [goalsByDate]);
  const last7 = allStats.slice(-7);
  const streak = useMemo(() => getCurrentStreak(allStats), [allStats]);

  const last7Completed = last7.reduce((sum, day) => sum + day.completed, 0);
  const last7Total = last7.reduce((sum, day) => sum + day.total, 0);
  const last7Rate = last7Total === 0 ? 0 : Math.round((last7Completed / last7Total) * 100);

  const bestDay = useMemo(() => {
    return allStats.reduce(
      (best, day) => {
        if (day.completed > best.completed) {
          return day;
        }
        return best;
      },
      { date: "-", completed: 0, total: 0, rate: 0 }
    );
  }, [allStats]);

  const cards = [
    { label: "Current streak", value: `${streak} days` },
    { label: "Last 7 days", value: `${last7Completed} done (${last7Rate}%)` },
    { label: "Best day", value: `${bestDay.date} (${bestDay.completed})` }
  ];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <h3 className="text-base font-semibold text-slate-900">Progress Snapshot</h3>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {cards.map((card) => (
          <article key={card.label} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs text-slate-500">{card.label}</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{card.value}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
