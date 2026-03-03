import { useState } from "react";

type AddGoalFormProps = {
  onAddGoal: (text: string) => void;
};

export default function AddGoalForm({ onAddGoal }: AddGoalFormProps) {
  const [value, setValue] = useState("");

  const submit = () => {
    if (!value.trim()) {
      return;
    }

    onAddGoal(value);
    setValue("");
  };

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <input
        type="text"
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Add a goal for this day"
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            submit();
          }

          if (event.key === "Escape") {
            setValue("");
          }
        }}
        aria-label="Goal text"
      />
      <button
        type="button"
        className="inline-flex min-h-10 w-full items-center justify-center rounded-md bg-sky-600 px-4 text-sm font-medium text-white transition hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        onClick={submit}
        disabled={!value.trim()}
      >
        Add
      </button>
    </div>
  );
}
