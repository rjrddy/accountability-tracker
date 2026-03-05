import type { RecurrenceType } from "@prisma/client";

export type ParsedSeriesInput = {
  text: string;
  recurrenceType: Exclude<RecurrenceType, "NONE">;
  interval: number;
  daysOfWeek: number[];
  dayOfMonth: number | null;
  startDate: string;
  endDate: string | null;
};

export function isDateKey(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function parseDaysOfWeek(value: unknown): number[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const days = value
    .filter((item): item is number => typeof item === "number" && Number.isInteger(item))
    .filter((item) => item >= 0 && item <= 6);

  return Array.from(new Set(days));
}

export function parseSeriesInput(value: {
  text?: unknown;
  recurrenceType?: unknown;
  interval?: unknown;
  daysOfWeek?: unknown;
  dayOfMonth?: unknown;
  startDate?: unknown;
  endDate?: unknown;
}): { ok: true; data: ParsedSeriesInput } | { ok: false; error: string } {
  const text = typeof value.text === "string" ? value.text.trim() : "";
  if (!text) {
    return { ok: false, error: "Text is required." };
  }

  if (
    value.recurrenceType !== "DAILY" &&
    value.recurrenceType !== "WEEKLY" &&
    value.recurrenceType !== "MONTHLY"
  ) {
    return { ok: false, error: "recurrenceType must be DAILY, WEEKLY, or MONTHLY." };
  }

  const interval =
    typeof value.interval === "number" && Number.isInteger(value.interval) && value.interval > 0
      ? value.interval
      : 1;

  const startDate = typeof value.startDate === "string" ? value.startDate : "";
  if (!isDateKey(startDate)) {
    return { ok: false, error: "Invalid startDate format." };
  }

  let endDate: string | null = null;
  if (typeof value.endDate === "string" && value.endDate.length > 0) {
    if (!isDateKey(value.endDate)) {
      return { ok: false, error: "Invalid endDate format." };
    }
    if (value.endDate < startDate) {
      return { ok: false, error: "endDate must be on or after startDate." };
    }
    endDate = value.endDate;
  }

  let daysOfWeek: number[] = [];
  let dayOfMonth: number | null = null;

  if (value.recurrenceType === "WEEKLY") {
    daysOfWeek = parseDaysOfWeek(value.daysOfWeek) ?? [];
    if (daysOfWeek.length === 0) {
      return { ok: false, error: "daysOfWeek is required for WEEKLY recurrence." };
    }
  }

  if (value.recurrenceType === "MONTHLY") {
    const dom = typeof value.dayOfMonth === "number" ? value.dayOfMonth : Number.NaN;
    if (!Number.isInteger(dom) || dom < 1 || dom > 31) {
      return { ok: false, error: "dayOfMonth must be between 1 and 31 for MONTHLY recurrence." };
    }
    dayOfMonth = dom;
  }

  return {
    ok: true,
    data: {
      text,
      recurrenceType: value.recurrenceType,
      interval,
      daysOfWeek,
      dayOfMonth,
      startDate,
      endDate
    }
  };
}
