import type { Goal, GoalCompletion, GoalOccurrenceOverride, GoalSeries, RecurrenceType } from "@prisma/client";
import { isSeriesActiveForDate, type SeriesLike } from "@/lib/tasks/recurrence";

export type EffectiveGoal = {
  kind: "oneTime" | "recurring";
  id: string;
  uiKey: string;
  date: string;
  text: string;
  completed: boolean;
  completedAt?: number;
  recurrenceType?: RecurrenceType;
  isOverride: boolean;
  createdAt: string;
};

type SeriesInput = Pick<
  GoalSeries,
  "id" | "uid" | "text" | "recurrenceType" | "interval" | "daysOfWeek" | "dayOfMonth" | "startDate" | "endDate" | "createdAt"
>;

type OneTimeInput = Pick<Goal, "id" | "date" | "text" | "completed" | "completedAt" | "createdAt">;
type CompletionInput = Pick<GoalCompletion, "seriesId" | "date" | "completed" | "completedAt">;
type OverrideInput = Pick<GoalOccurrenceOverride, "seriesId" | "date" | "overrideText" | "isSkipped">;

function toSeriesLike(series: SeriesInput): SeriesLike {
  return {
    recurrenceType: series.recurrenceType,
    interval: series.interval,
    daysOfWeek: series.daysOfWeek,
    dayOfMonth: series.dayOfMonth,
    startDate: series.startDate,
    endDate: series.endDate
  };
}

function completionKey(seriesId: string, date: string): string {
  return `${seriesId}:${date}`;
}

export function resolveEffectiveGoalsForDate(params: {
  date: string;
  oneTimeGoals: OneTimeInput[];
  series: SeriesInput[];
  completions: CompletionInput[];
  overrides: OverrideInput[];
}): EffectiveGoal[] {
  const completionByKey = new Map(
    params.completions
      .filter((item): item is CompletionInput & { seriesId: string } => Boolean(item.seriesId))
      .map((item) => [completionKey(item.seriesId, item.date), item])
  );
  const overrideBySeries = new Map(params.overrides.map((item) => [completionKey(item.seriesId, item.date), item]));

  const oneTime: EffectiveGoal[] = params.oneTimeGoals.map((goal) => ({
    kind: "oneTime",
    id: goal.id,
    uiKey: `oneTime:${goal.id}`,
    date: goal.date,
    text: goal.text,
    completed: goal.completed,
    completedAt: goal.completedAt ? goal.completedAt.getTime() : undefined,
    isOverride: false,
    createdAt: goal.createdAt.toISOString()
  }));

  const recurring: EffectiveGoal[] = [];

  for (const item of params.series) {
    if (!isSeriesActiveForDate(toSeriesLike(item), params.date)) {
      continue;
    }

    const override = overrideBySeries.get(completionKey(item.id, params.date));
    if (override?.isSkipped) {
      continue;
    }

    const completion = completionByKey.get(completionKey(item.id, params.date));
    recurring.push({
      kind: "recurring",
      id: item.id,
      uiKey: `recurring:${item.id}:${params.date}`,
      date: params.date,
      text: override?.overrideText ?? item.text,
      completed: completion?.completed ?? false,
      completedAt: completion?.completedAt ? completion.completedAt.getTime() : undefined,
      recurrenceType: item.recurrenceType,
      isOverride: Boolean(override?.overrideText),
      createdAt: item.createdAt.toISOString()
    });
  }

  return [...oneTime, ...recurring];
}
