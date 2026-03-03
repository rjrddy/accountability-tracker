"use client";

import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { GoalsByDate } from "@/lib/goalsStore";
import { getLastNDaysStats } from "@/lib/stats";

type TrendsChartProps = {
  goalsByDate: GoalsByDate;
};

type Metric = "rate" | "completed";

const RANGE_OPTIONS = [7, 14, 30, 90] as const;

export default function TrendsChart({ goalsByDate }: TrendsChartProps) {
  const [metric, setMetric] = useState<Metric>("rate");
  const [rangeDays, setRangeDays] = useState<number>(14);

  const stats = useMemo(() => getLastNDaysStats(rangeDays, goalsByDate), [goalsByDate, rangeDays]);
  const chartData = useMemo(
    () =>
      stats.map((stat) => ({
        ...stat,
        shortDate: stat.date.slice(5),
        value: metric === "rate" ? stat.rate : stat.completed
      })),
    [metric, stats]
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-900">Trends</h3>
        <div className="flex flex-wrap gap-2">
          <div className="inline-flex rounded-md border border-slate-300 p-0.5">
            <button
              type="button"
              onClick={() => setMetric("rate")}
              className={`inline-flex h-8 items-center rounded px-2.5 text-xs font-medium ${
                metric === "rate" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              Completion %
            </button>
            <button
              type="button"
              onClick={() => setMetric("completed")}
              className={`inline-flex h-8 items-center rounded px-2.5 text-xs font-medium ${
                metric === "completed" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              Completed count
            </button>
          </div>
          <select
            value={rangeDays}
            onChange={(event) => setRangeDays(Number(event.target.value))}
            aria-label="Select trends range"
            className="h-9 rounded-md border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
          >
            {RANGE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                Last {option} days
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="shortDate" tick={{ fontSize: 11, fill: "#64748b" }} minTickGap={14} />
            <YAxis
              tick={{ fontSize: 11, fill: "#64748b" }}
              domain={metric === "rate" ? [0, 100] : [0, "auto"]}
              width={34}
            />
            <Tooltip
              contentStyle={{ borderRadius: "0.5rem", borderColor: "#cbd5e1", fontSize: "12px" }}
              labelFormatter={(value, payload) => {
                const first = payload?.[0]?.payload;
                return typeof first?.date === "string" ? first.date : String(value);
              }}
              formatter={(value) => [
                value,
                metric === "rate" ? "Completion %" : "Completed goals"
              ]}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#0ea5e9"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
