export type RecurrenceType = "NONE" | "DAILY" | "WEEKLY" | "MONTHLY";

export type SeriesLike = {
  recurrenceType: RecurrenceType;
  interval: number;
  daysOfWeek: number[];
  dayOfMonth: number | null;
  startDate: string;
  endDate: string | null;
};

function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function dayDiff(startDateKey: string, endDateKey: string): number {
  const start = parseDateKey(startDateKey);
  const end = parseDateKey(endDateKey);
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((end.getTime() - start.getTime()) / msPerDay);
}

function monthDiff(startDateKey: string, endDateKey: string): number {
  const start = parseDateKey(startDateKey);
  const end = parseDateKey(endDateKey);
  return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
}

function startOfWeek(dateKey: string): string {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() - date.getDay());
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 10);
}

function isInDateWindow(series: Pick<SeriesLike, "startDate" | "endDate">, date: string): boolean {
  if (date < series.startDate) {
    return false;
  }

  if (series.endDate && date > series.endDate) {
    return false;
  }

  return true;
}

export function isSeriesActiveForDate(series: SeriesLike, date: string): boolean {
  if (!isInDateWindow(series, date)) {
    return false;
  }

  const effectiveInterval = Math.max(1, Math.trunc(series.interval) || 1);
  const dateObj = parseDateKey(date);
  const diffDays = dayDiff(series.startDate, date);

  if (diffDays < 0) {
    return false;
  }

  switch (series.recurrenceType) {
    case "NONE":
      return date === series.startDate;
    case "DAILY":
      return diffDays % effectiveInterval === 0;
    case "WEEKLY": {
      const allowedDays = series.daysOfWeek;
      if (!allowedDays.includes(dateObj.getDay())) {
        return false;
      }

      const diffWeeks = dayDiff(startOfWeek(series.startDate), startOfWeek(date)) / 7;
      return Number.isInteger(diffWeeks) && diffWeeks >= 0 && diffWeeks % effectiveInterval === 0;
    }
    case "MONTHLY": {
      const targetDay = series.dayOfMonth ?? parseDateKey(series.startDate).getDate();
      if (dateObj.getDate() !== targetDay) {
        return false;
      }

      const diffMonths = monthDiff(series.startDate, date);
      return diffMonths >= 0 && diffMonths % effectiveInterval === 0;
    }
    default:
      return false;
  }
}
