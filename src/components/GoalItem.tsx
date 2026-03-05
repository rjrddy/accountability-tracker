import { useState } from "react";
import type { Goal } from "@/lib/goalsStore";

type GoalItemProps = {
  goal: Goal;
  onToggle: (goal: Goal) => void;
  onDelete: (goal: Goal, scope?: "occurrence" | "series") => void;
  onUpdateText: (goal: Goal, newText: string, scope?: "occurrence" | "series") => void;
};

export default function GoalItem({ goal, onToggle, onDelete, onUpdateText }: GoalItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftText, setDraftText] = useState(goal.text);
  const isRecurring = goal.kind === "recurring";

  const recurrenceLabel =
    goal.recurrenceType === "DAILY"
      ? "Daily"
      : goal.recurrenceType === "WEEKLY"
        ? "Weekly"
        : goal.recurrenceType === "MONTHLY"
          ? "Monthly"
          : null;

  const saveEdit = (scope: "occurrence" | "series" = "occurrence") => {
    const trimmed = draftText.trim();
    if (!trimmed) {
      setDraftText(goal.text);
      setIsEditing(false);
      return;
    }

    onUpdateText(goal, trimmed, scope);
    setIsEditing(false);
  };

  return (
    <li
      className={`flex items-start gap-3 p-3 transition-colors ${
        isEditing ? "bg-sky-50/90" : "bg-white hover:bg-slate-50"
      }`}
    >
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-1"
        checked={goal.completed}
        onChange={() => onToggle(goal)}
        aria-label={`Toggle goal ${goal.text}`}
      />

      <div className="min-w-0 flex-1">
        {recurrenceLabel ? (
          <span className="mb-1 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
            {recurrenceLabel}
          </span>
        ) : null}

        {isEditing ? (
          <input
            type="text"
            className="w-full rounded-md border border-sky-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
            value={draftText}
            onChange={(event) => setDraftText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                saveEdit(isRecurring ? "occurrence" : undefined);
              }

              if (event.key === "Escape") {
                setDraftText(goal.text);
                setIsEditing(false);
              }
            }}
            onBlur={() => saveEdit(isRecurring ? "occurrence" : undefined)}
            autoFocus
            aria-label="Edit goal text"
          />
        ) : (
          <span
            className={`block break-words text-sm leading-6 ${
              goal.completed ? "text-slate-400 line-through" : "text-slate-800"
            }`}
          >
            {goal.text}
          </span>
        )}
      </div>

      <div className="ml-auto flex items-center gap-1 self-center">
        {!isEditing && !isRecurring ? (
          <button
            type="button"
            className="inline-flex min-h-8 items-center rounded-md px-2 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1"
            onClick={() => setIsEditing(true)}
          >
            Edit
          </button>
        ) : null}

        {!isEditing && isRecurring ? (
          <details className="relative">
            <summary className="inline-flex min-h-8 cursor-pointer list-none items-center rounded-md px-2 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1">
              More
            </summary>
            <div className="absolute right-0 z-10 mt-1 w-40 rounded-md border border-slate-200 bg-white p-1 shadow-lg">
              <button
                type="button"
                className="block w-full rounded px-2 py-1 text-left text-xs text-slate-700 hover:bg-slate-50"
                onClick={() => {
                  setIsEditing(true);
                }}
              >
                Edit today only
              </button>
              <button
                type="button"
                className="block w-full rounded px-2 py-1 text-left text-xs text-slate-700 hover:bg-slate-50"
                onClick={() => {
                  const next = window.prompt("Edit series text", goal.text);
                  if (!next) {
                    return;
                  }
                  onUpdateText(goal, next, "series");
                }}
              >
                Edit series
              </button>
              <button
                type="button"
                className="block w-full rounded px-2 py-1 text-left text-xs text-red-600 hover:bg-red-50"
                onClick={() => onDelete(goal, "occurrence")}
              >
                Remove today only
              </button>
              <button
                type="button"
                className="block w-full rounded px-2 py-1 text-left text-xs text-red-600 hover:bg-red-50"
                onClick={() => onDelete(goal, "series")}
              >
                Delete series
              </button>
            </div>
          </details>
        ) : null}

        {isEditing ? (
          <button
            type="button"
            className="inline-flex h-8 items-center rounded-md px-2 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1"
            onClick={() => {
              setDraftText(goal.text);
              setIsEditing(false);
            }}
          >
            Cancel
          </button>
        ) : null}

        {!isRecurring ? (
          <button
            type="button"
            className="inline-flex min-h-8 items-center rounded-md px-2 text-xs font-medium text-red-600 transition hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-1"
            onClick={() => onDelete(goal)}
          >
            Del
          </button>
        ) : null}
      </div>
    </li>
  );
}
