"use client";

type HeaderProps = {
  todayLabel: string;
  rightSlot?: React.ReactNode;
};

export default function Header({ todayLabel, rightSlot }: HeaderProps) {
  return (
    <header className="mb-4 flex flex-col gap-2 sm:mb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Accountability Tracker
        </h1>
        <p className="mt-1 text-sm text-slate-600">{todayLabel}</p>
      </div>
      {rightSlot ? <div className="hidden sm:flex sm:items-center sm:gap-3">{rightSlot}</div> : null}
    </header>
  );
}
