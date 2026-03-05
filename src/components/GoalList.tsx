import type { Goal } from "@/lib/goalsStore";
import { sortGoalsForDisplay } from "@/lib/goalsStore";
import GoalItem from "@/components/GoalItem";

type GoalListProps = {
  goals: Goal[];
  onToggle: (goal: Goal) => void;
  onDelete: (goal: Goal) => void;
  onUpdateText: (goal: Goal, newText: string, scope?: "occurrence" | "series") => void;
};

export default function GoalList({ goals, onToggle, onDelete, onUpdateText }: GoalListProps) {
  const sortedGoals = sortGoalsForDisplay(goals);

  if (goals.length === 0) {
    return (
      <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm text-slate-500">
        No goals yet for this date. Add one to get started.
      </div>
    );
  }

  return (
    <ul className="mt-4 divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
      {sortedGoals.map((goal) => (
        <GoalItem
          key={goal.uiKey ?? goal.id}
          goal={goal}
          onToggle={onToggle}
          onDelete={onDelete}
          onUpdateText={onUpdateText}
        />
      ))}
    </ul>
  );
}
