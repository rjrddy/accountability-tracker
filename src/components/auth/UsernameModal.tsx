"use client";

type UsernameModalProps = {
  value: string;
  error: string | null;
  loading: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
};

export default function UsernameModal({
  value,
  error,
  loading,
  onChange,
  onSubmit
}: UsernameModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-900">Choose your username</h2>
        <p className="mt-1 text-sm text-slate-600">Set a unique username to continue.</p>

        <div className="mt-4 space-y-2">
          <input
            type="text"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            placeholder="e.g. daily_builder"
            aria-label="Username"
            disabled={loading}
          />
          {error ? <p className="text-xs text-red-600">{error}</p> : null}
        </div>

        <button
          type="button"
          onClick={onSubmit}
          disabled={loading}
          className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-md bg-sky-600 px-4 text-sm font-medium text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Saving..." : "Continue"}
        </button>
      </div>
    </div>
  );
}
