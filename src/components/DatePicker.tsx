type DatePickerProps = {
  value: string;
  onChange: (nextValue: string) => void;
};

export default function DatePicker({ value, onChange }: DatePickerProps) {
  return (
    <label className="flex flex-col gap-2 sm:flex-row sm:items-center" htmlFor="goal-date">
      <span className="text-sm font-medium text-slate-700">Date</span>
      <input
        id="goal-date"
        type="date"
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label="Select date"
      />
    </label>
  );
}
