import { useState } from "react";
import type { Goal } from "@/lib/goalsStore";

type GoalItemProps = {
  goal: Goal;
  onToggle: (goalId: string) => void;
  onDelete: (goalId: string) => void;
  onUpdateText: (goalId: string, newText: string) => void;
};

export default function GoalItem({ goal, onToggle, onDelete, onUpdateText }: GoalItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftText, setDraftText] = useState(goal.text);

  const saveEdit = () => {
    const trimmed = draftText.trim();
    if (!trimmed) {
      setDraftText(goal.text);
      setIsEditing(false);
      return;
    }

    onUpdateText(goal.id, trimmed);
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
        onChange={() => onToggle(goal.id)}
        aria-label={`Toggle goal ${goal.text}`}
      />

      <div className="min-w-0 flex-1">
        {isEditing ? (
          <input
            type="text"
            className="w-full rounded-md border border-sky-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
            value={draftText}
            onChange={(event) => setDraftText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                saveEdit();
              }

              if (event.key === "Escape") {
                setDraftText(goal.text);
                setIsEditing(false);
              }
            }}
            onBlur={saveEdit}
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

      <div className="ml-2 flex items-center gap-1 self-center">
        {!isEditing ? (
          <button
            type="button"
            className="inline-flex h-8 items-center rounded-md px-2 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1"
            onClick={() => setIsEditing(true)}
          >
            Edit
          </button>
        ) : (
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
        )}

        <button
          type="button"
          className="inline-flex h-8 items-center rounded-md bg-red-50 px-2 text-xs font-medium text-red-700 transition hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-1"
          onClick={() => onDelete(goal.id)}
        >
          Delete
        </button>
      </div>
    </li>
  );
}
