import { useEffect, useState } from "react";

export type AddGoalInput = {
  text: string;
  recurrenceType: "NONE" | "DAILY" | "WEEKLY" | "MONTHLY";
  daysOfWeek?: number[];
  dayOfMonth?: number;
};

type AddGoalFormProps = {
  selectedDate: string;
  mode: "guest" | "signed-in";
  authLoading?: boolean;
  onAddGoal: (input: AddGoalInput) => Promise<void>;
};

const WEEKDAY_LABELS = [
  { value: 0, label: "S" },
  { value: 1, label: "M" },
  { value: 2, label: "T" },
  { value: 3, label: "W" },
  { value: 4, label: "T" },
  { value: 5, label: "F" },
  { value: 6, label: "S" }
] as const;

function getDateDay(dateKey: string): number {
  const day = Number(dateKey.split("-")[2]);
  return Number.isInteger(day) ? day : 1;
}

export default function AddGoalForm({
  selectedDate,
  mode,
  authLoading = false,
  onAddGoal
}: AddGoalFormProps) {
  const [value, setValue] = useState("");
  const [recurrenceType, setRecurrenceType] = useState<AddGoalInput["recurrenceType"]>("NONE");
  const [weeklyDays, setWeeklyDays] = useState<number[]>([]);
  const [dayOfMonth, setDayOfMonth] = useState<number>(getDateDay(selectedDate));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    setDayOfMonth(getDateDay(selectedDate));
  }, [selectedDate]);

  const submit = async () => {
    const trimmed = value.trim();
    if (!trimmed) {
      setSubmitError("Goal text is required.");
      return;
    }

    const payload: AddGoalInput = {
      text: trimmed,
      recurrenceType
    };

    if (recurrenceType === "WEEKLY") {
      payload.daysOfWeek = weeklyDays;
    }

    if (recurrenceType === "MONTHLY") {
      payload.dayOfMonth = Math.max(1, Math.min(31, Math.trunc(dayOfMonth) || getDateDay(selectedDate)));
    }

    if (recurrenceType === "WEEKLY" && weeklyDays.length === 0) {
      setSubmitError("Select at least one weekday.");
      return;
    }

    if (process.env.NODE_ENV !== "production") {
      console.log("AddGoalForm submit", { date: selectedDate, text: trimmed, mode });
    }

    if (authLoading && mode === "signed-in") {
      setSubmitError("Signing you in...");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await onAddGoal(payload);
      setValue("");
      setRecurrenceType("NONE");
      setWeeklyDays([]);
      setDayOfMonth(getDateDay(selectedDate));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to add task.";
      if (process.env.NODE_ENV !== "production") {
        console.error("AddGoalForm submit failed", error);
      }
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      className="space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="text"
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setSubmitError(null);
          }}
          placeholder="Add a goal for this day"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setValue("");
            }
          }}
          aria-label="Goal text"
        />
        <button
          type="submit"
          className="inline-flex min-h-10 w-full items-center justify-center rounded-md bg-sky-600 px-4 text-sm font-medium text-white transition hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          disabled={
            isSubmitting ||
            authLoading ||
            !value.trim() ||
            (recurrenceType === "WEEKLY" && weeklyDays.length === 0)
          }
        >
          {isSubmitting ? "Adding..." : "Add"}
        </button>
      </div>

      <div className="rounded-md border border-slate-200 bg-white p-2">
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs font-medium text-slate-600" htmlFor="repeat">
            Repeat
          </label>
          <select
            id="repeat"
            value={recurrenceType}
            onChange={(event) => setRecurrenceType(event.target.value as AddGoalInput["recurrenceType"])}
            className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs font-medium text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          >
            <option value="NONE">None</option>
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
            <option value="MONTHLY">Monthly</option>
          </select>
        </div>

        {recurrenceType === "WEEKLY" ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {WEEKDAY_LABELS.map((day) => {
              const selected = weeklyDays.includes(day.value);
              return (
                <button
                  key={day.value}
                  type="button"
                  onClick={() =>
                    setWeeklyDays((current) =>
                      current.includes(day.value)
                        ? current.filter((item) => item !== day.value)
                        : [...current, day.value]
                    )
                  }
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-full border text-xs font-medium ${
                    selected
                      ? "border-sky-600 bg-sky-600 text-white"
                      : "border-slate-300 bg-white text-slate-700"
                  }`}
                  aria-label={`Toggle weekday ${day.value}`}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
        ) : null}

        {recurrenceType === "MONTHLY" ? (
          <div className="mt-2 flex items-center gap-2">
            <label htmlFor="day-of-month" className="text-xs text-slate-600">
              Day
            </label>
            <input
              id="day-of-month"
              type="number"
              min={1}
              max={31}
              value={dayOfMonth}
              onChange={(event) => setDayOfMonth(Number(event.target.value))}
              className="h-8 w-20 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            />
          </div>
        ) : null}
      </div>
      {submitError ? (
        <p className="text-xs font-medium text-red-600" aria-live="polite">
          {submitError}
        </p>
      ) : null}
    </form>
  );
}
