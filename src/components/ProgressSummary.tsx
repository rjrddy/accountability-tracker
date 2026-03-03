import type { Goal } from "@/lib/goalsStore";
import { getProgress } from "@/lib/goalsStore";

type ProgressSummaryProps = {
  goals: Goal[];
};

export default function ProgressSummary({ goals }: ProgressSummaryProps) {
  const { completed, total, percentage } = getProgress(goals);

  return (
    <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700" aria-live="polite">
      {completed}/{total} completed ({percentage}%)
    </p>
  );
}
