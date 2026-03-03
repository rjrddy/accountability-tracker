"use client";

import { useMemo, useState } from "react";
import type { GoalsByDate } from "@/lib/goalsStore";
import { getLastNDaysStats, intensityBucket, type DayStat } from "@/lib/stats";

type ContributionGridProps = {
  goalsByDate: GoalsByDate;
  selectedDate: string;
  onSelectDate: (date: string) => void;
};

type GridDay = DayStat | null;

const RANGE_OPTIONS = [
  { label: "Last 12 weeks", value: 84 },
  { label: "Last 365 days", value: 365 }
] as const;

const INTENSITY_CLASSES = [
  "bg-slate-100 border-slate-200",
  "bg-emerald-100 border-emerald-200",
  "bg-emerald-200 border-emerald-300",
  "bg-emerald-400 border-emerald-500",
  "bg-emerald-600 border-emerald-700"
] as const;

function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toWeekColumns(stats: DayStat[]): GridDay[][] {
  if (stats.length === 0) {
    return [];
  }

  const leadingBlanks = parseDateKey(stats[0].date).getDay();
  const days: GridDay[] = [...Array.from({ length: leadingBlanks }, () => null), ...stats];
  const weeks: GridDay[][] = [];

  for (let i = 0; i < days.length; i += 7) {
    const week = days.slice(i, i + 7);
    while (week.length < 7) {
      week.push(null);
    }
    weeks.push(week);
  }

  return weeks;
}

function tooltipText(stat: DayStat): string {
  return `${stat.date}: ${stat.completed}/${stat.total} completed (${stat.rate}%)`;
}

export default function ContributionGrid({
  goalsByDate,
  selectedDate,
  onSelectDate
}: ContributionGridProps) {
  const [rangeDays, setRangeDays] = useState<number>(84);
  const stats = useMemo(() => getLastNDaysStats(rangeDays, goalsByDate), [goalsByDate, rangeDays]);
  const weekColumns = useMemo(() => toWeekColumns(stats), [stats]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-900">Contribution Grid</h3>
        <select
          value={rangeDays}
          onChange={(event) => setRangeDays(Number(event.target.value))}
          aria-label="Select contribution range"
          className="h-9 rounded-md border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
        >
          {RANGE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 overflow-x-auto">
        <div className="inline-flex gap-1">
          {weekColumns.map((week, weekIndex) => (
            <div key={`${rangeDays}-${weekIndex}`} className="grid grid-rows-7 gap-1">
              {week.map((stat, dayIndex) => {
                if (!stat) {
                  return <div key={`blank-${weekIndex}-${dayIndex}`} className="h-3.5 w-3.5" />;
                }

                const intensity = intensityBucket(stat);
                const isSelected = stat.date === selectedDate;

                return (
                  <button
                    key={stat.date}
                    type="button"
                    title={tooltipText(stat)}
                    aria-label={tooltipText(stat)}
                    onClick={() => onSelectDate(stat.date)}
                    className={`h-3.5 w-3.5 rounded-[3px] border transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-1 ${
                      INTENSITY_CLASSES[intensity]
                    } ${isSelected ? "ring-1 ring-sky-600 ring-offset-1" : ""}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2 text-xs text-slate-500">
        <p>Click any day to jump to that date.</p>
        <div className="flex items-center gap-1">
          <span>Less</span>
          {INTENSITY_CLASSES.map((classes) => (
            <span key={classes} className={`h-3.5 w-3.5 rounded-[3px] border ${classes}`} />
          ))}
          <span>More</span>
        </div>
      </div>
    </section>
  );
}
