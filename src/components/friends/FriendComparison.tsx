"use client";

import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { GoalsByDate } from "@/lib/goalsStore";
import { getGoalsForDate, sortGoalsForDisplay } from "@/lib/goalsStore";
import { getLastNDaysStats, intensityBucket } from "@/lib/stats";
import type { UserProfile } from "@/lib/social/types";

type ComparisonSection = "list" | "heatmap" | "chart";

type FriendComparisonProps = {
  me: UserProfile;
  friend: UserProfile;
  myGoalsByDate: GoalsByDate;
  friendGoalsByDate: GoalsByDate;
};

const RANGE_OPTIONS = [7, 14, 30, 90] as const;
const INTENSITY_CLASSES = [
  "bg-slate-100 border-slate-200",
  "bg-emerald-100 border-emerald-200",
  "bg-emerald-200 border-emerald-300",
  "bg-emerald-400 border-emerald-500",
  "bg-emerald-600 border-emerald-700"
] as const;

function getDateKey(date: Date): string {
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().split("T")[0];
}

function renderGoalList(goals: ReturnType<typeof getGoalsForDate>): React.ReactNode {
  const sorted = sortGoalsForDisplay(goals);
  if (sorted.length === 0) {
    return <p className="text-sm text-slate-500">No goals for this date.</p>;
  }

  return (
    <ul className="space-y-1.5">
      {sorted.map((goal) => (
        <li
          key={goal.id}
          className={`rounded-md border px-2.5 py-2 text-sm ${
            goal.completed
              ? "border-slate-200 bg-slate-50 text-slate-400 line-through"
              : "border-slate-200 bg-white text-slate-800"
          }`}
        >
          {goal.text}
        </li>
      ))}
    </ul>
  );
}

function Heatmap({ goalsByDate }: { goalsByDate: GoalsByDate }) {
  const stats = useMemo(() => getLastNDaysStats(84, goalsByDate), [goalsByDate]);

  return (
    <div className="grid grid-cols-12 gap-1.5">
      {stats.map((stat) => (
        <div
          key={stat.date}
          title={`${stat.date}: ${stat.completed}/${stat.total} (${stat.rate}%)`}
          className={`h-3.5 w-full rounded-[3px] border ${INTENSITY_CLASSES[intensityBucket(stat)]}`}
        />
      ))}
    </div>
  );
}

export default function FriendComparison({
  me,
  friend,
  myGoalsByDate,
  friendGoalsByDate
}: FriendComparisonProps) {
  const [dateKey, setDateKey] = useState(getDateKey(new Date()));
  const [rangeDays, setRangeDays] = useState(14);
  const [section, setSection] = useState<ComparisonSection>("list");

  const myDayGoals = useMemo(() => getGoalsForDate(myGoalsByDate, dateKey), [dateKey, myGoalsByDate]);
  const friendDayGoals = useMemo(
    () => getGoalsForDate(friendGoalsByDate, dateKey),
    [dateKey, friendGoalsByDate]
  );

  const chartData = useMemo(() => {
    const myStats = getLastNDaysStats(rangeDays, myGoalsByDate);
    const friendStats = getLastNDaysStats(rangeDays, friendGoalsByDate);
    return myStats.map((myDay, index) => {
      const friendDay = friendStats[index];
      return {
        date: myDay.date.slice(5),
        meRate: myDay.rate,
        friendRate: friendDay?.rate ?? 0
      };
    });
  }, [friendGoalsByDate, myGoalsByDate, rangeDays]);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-base font-semibold text-slate-900">Comparison with @{friend.username}</h3>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={dateKey}
            onChange={(event) => setDateKey(event.target.value)}
            className="h-9 rounded-md border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            aria-label="Select comparison date"
          />
          <select
            value={rangeDays}
            onChange={(event) => setRangeDays(Number(event.target.value))}
            className="h-9 rounded-md border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            aria-label="Select comparison chart range"
          >
            {RANGE_OPTIONS.map((range) => (
              <option key={range} value={range}>
                Last {range}
              </option>
            ))}
          </select>
        </div>
      </div>

      <nav className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-1 sm:hidden">
        <div className="grid grid-cols-3 gap-1">
          {(["list", "heatmap", "chart"] as ComparisonSection[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setSection(key)}
              className={`h-8 rounded text-xs font-medium capitalize ${
                section === key ? "bg-slate-900 text-white" : "text-slate-600"
              }`}
            >
              {key}
            </button>
          ))}
        </div>
      </nav>

      <div className="mt-4 space-y-4 sm:space-y-5">
        {(section === "list" || section === "heatmap" || section === "chart") && (
          <div className={`${section !== "list" ? "hidden sm:grid" : "grid"} gap-3 sm:grid-cols-2`}>
            <article className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <h4 className="mb-2 text-sm font-semibold text-slate-800">@{me.username}</h4>
              {renderGoalList(myDayGoals)}
            </article>
            <article className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <h4 className="mb-2 text-sm font-semibold text-slate-800">@{friend.username}</h4>
              {renderGoalList(friendDayGoals)}
            </article>
          </div>
        )}

        {(section === "heatmap" || section === "list" || section === "chart") && (
          <div className={`${section !== "heatmap" ? "hidden sm:grid" : "grid"} gap-3 sm:grid-cols-2`}>
            <article className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <h4 className="mb-2 text-sm font-semibold text-slate-800">@{me.username} heatmap</h4>
              <Heatmap goalsByDate={myGoalsByDate} />
            </article>
            <article className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <h4 className="mb-2 text-sm font-semibold text-slate-800">@{friend.username} heatmap</h4>
              <Heatmap goalsByDate={friendGoalsByDate} />
            </article>
          </div>
        )}

        {(section === "chart" || section === "list" || section === "heatmap") && (
          <article className={`${section !== "chart" ? "hidden sm:block" : "block"} rounded-lg border border-slate-200 bg-slate-50 p-3`}>
            <h4 className="mb-2 text-sm font-semibold text-slate-800">Completion rate trend</h4>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#64748b" }} width={34} />
                  <Tooltip />
                  <Line type="monotone" dataKey="meRate" stroke="#0ea5e9" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="friendRate" stroke="#334155" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </article>
        )}
      </div>
    </section>
  );
}
