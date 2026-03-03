"use client";

import { useEffect, useMemo, useState } from "react";
import AddGoalForm from "@/components/AddGoalForm";
import ContributionGrid from "@/components/analytics/ContributionGrid";
import ProgressCards from "@/components/analytics/ProgressCards";
import TrendsChart from "@/components/analytics/TrendsChart";
import AuthButtons from "@/components/auth/AuthButtons";
import DatePicker from "@/components/DatePicker";
import GoalList from "@/components/GoalList";
import Header from "@/components/layout/Header";
import MobileTabs, { type MobileTab } from "@/components/layout/MobileTabs";
import ProgressSummary from "@/components/ProgressSummary";
import { useAuth } from "@/context/AuthContext";
import {
  addGoal,
  clearCompleted,
  deleteGoal,
  getGoalsForDate,
  getStorageKey,
  loadGoalsByDate,
  saveGoalsByDate,
  toggleGoalCompleted,
  updateGoalText,
  type GoalsByDate
} from "@/lib/goalsStore";

function getDateKey(date: Date): string {
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().split("T")[0];
}

function getTodayDateKey(): string {
  return getDateKey(new Date());
}

function hasAnyGoals(goalsByDate: GoalsByDate): boolean {
  return Object.values(goalsByDate).some((goals) => goals.length > 0);
}

function mergeGoalsByDate(existing: GoalsByDate, incoming: GoalsByDate): GoalsByDate {
  const merged: GoalsByDate = { ...existing };

  for (const [date, incomingGoals] of Object.entries(incoming)) {
    const current = merged[date] ?? [];
    const seen = new Set(current.map((goal) => goal.id));
    const dedupedIncoming = incomingGoals.filter((goal) => !seen.has(goal.id));
    merged[date] = [...current, ...dedupedIncoming];
  }

  return merged;
}

function ChecklistPanel({
  selectedDate,
  onDateChange,
  goalsForDate,
  isHydrated,
  onAddGoal,
  onToggle,
  onDelete,
  onUpdateText,
  onClearCompleted
}: {
  selectedDate: string;
  onDateChange: (date: string) => void;
  goalsForDate: ReturnType<typeof getGoalsForDate>;
  isHydrated: boolean;
  onAddGoal: (text: string) => void;
  onToggle: (goalId: string) => void;
  onDelete: (goalId: string) => void;
  onUpdateText: (goalId: string, nextText: string) => void;
  onClearCompleted: () => void;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <h2 className="text-xl font-semibold tracking-tight text-slate-900">Daily Goals</h2>
      <p className="mt-2 text-sm text-slate-600">Track what matters for each day.</p>

      <div className="mt-5 grid gap-4 sm:gap-5">
        <DatePicker value={selectedDate} onChange={onDateChange} />

        <AddGoalForm onAddGoal={onAddGoal} />

        <ProgressSummary goals={goalsForDate} />

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-10 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onClearCompleted}
            disabled={!goalsForDate.some((goal) => goal.completed)}
          >
            Clear completed
          </button>
        </div>
      </div>

      {isHydrated ? (
        <GoalList goals={goalsForDate} onToggle={onToggle} onDelete={onDelete} onUpdateText={onUpdateText} />
      ) : (
        <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm text-slate-500">
          Loading goals...
        </div>
      )}
    </section>
  );
}

function ProgressPanel({
  goalsByDate,
  selectedDate,
  onSelectDate
}: {
  goalsByDate: GoalsByDate;
  selectedDate: string;
  onSelectDate: (date: string) => void;
}) {
  return (
    <div className="space-y-4">
      <ProgressCards goalsByDate={goalsByDate} />
      <TrendsChart goalsByDate={goalsByDate} />
      <ContributionGrid goalsByDate={goalsByDate} selectedDate={selectedDate} onSelectDate={onSelectDate} />
    </div>
  );
}

function SettingsPanel({
  loading,
  isConfigured,
  userLabel,
  onSignIn,
  onSignOut,
  canImportGuestData,
  onImportGuestData,
  statusMessage
}: {
  loading: boolean;
  isConfigured: boolean;
  userLabel: string | null;
  onSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
  canImportGuestData: boolean;
  onImportGuestData: () => void;
  statusMessage: string | null;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900">Settings</h2>
      <p className="mt-1 text-sm text-slate-600">Sign in to keep progress scoped to your account.</p>

      <div className="mt-4 flex flex-col items-start gap-3">
        <AuthButtons
          userLabel={userLabel}
          loading={loading}
          isConfigured={isConfigured}
          onSignIn={onSignIn}
          onSignOut={onSignOut}
        />

        {canImportGuestData ? (
          <button
            type="button"
            onClick={onImportGuestData}
            className="inline-flex h-9 items-center rounded-md border border-sky-300 bg-sky-50 px-3 text-xs font-medium text-sky-800 transition hover:bg-sky-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
          >
            Import guest data into account
          </button>
        ) : null}

        {statusMessage ? <p className="text-xs text-slate-500">{statusMessage}</p> : null}
      </div>
    </section>
  );
}

export default function HomePage() {
  const { user, loading, isConfigured, signIn, signOut } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateKey());
  const [goalsByDate, setGoalsByDate] = useState<GoalsByDate>({});
  const [isHydrated, setIsHydrated] = useState(false);
  const [activeTab, setActiveTab] = useState<MobileTab>("today");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const storageKey = useMemo(() => getStorageKey(user?.uid), [user?.uid]);
  const guestStorageKey = useMemo(() => getStorageKey(null), []);

  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric"
      }).format(new Date()),
    []
  );

  useEffect(() => {
    const loaded = loadGoalsByDate(storageKey);
    setGoalsByDate(loaded);
    setIsHydrated(true);
  }, [storageKey]);

  const canImportGuestData = useMemo(() => {
    if (!user) {
      return false;
    }

    const guestData = loadGoalsByDate(guestStorageKey);
    return hasAnyGoals(guestData);
  }, [guestStorageKey, user]);

  const userLabel = user?.displayName ?? user?.email ?? null;

  const goalsForDate = useMemo(
    () => getGoalsForDate(goalsByDate, selectedDate),
    [goalsByDate, selectedDate]
  );

  const updateAndPersist = (updater: (current: GoalsByDate) => GoalsByDate) => {
    setGoalsByDate((current) => {
      const next = updater(current);
      saveGoalsByDate(next, storageKey);
      return next;
    });
  };

  const handleImportGuestData = () => {
    if (!user) {
      return;
    }

    const guestData = loadGoalsByDate(guestStorageKey);
    if (!hasAnyGoals(guestData)) {
      setStatusMessage("No guest data found.");
      return;
    }

    const merged = mergeGoalsByDate(goalsByDate, guestData);
    setGoalsByDate(merged);
    saveGoalsByDate(merged, storageKey);
    setStatusMessage("Imported guest data. Guest data is still preserved locally.");
  };

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-6xl">
        <Header
          todayLabel={todayLabel}
          rightSlot={
            <div className="flex items-center gap-2">
              <AuthButtons
                userLabel={userLabel}
                loading={loading}
                isConfigured={isConfigured}
                onSignIn={signIn}
                onSignOut={signOut}
              />
              {canImportGuestData ? (
                <button
                  type="button"
                  onClick={handleImportGuestData}
                  className="inline-flex h-9 items-center rounded-md border border-sky-300 bg-sky-50 px-3 text-xs font-medium text-sky-800 transition hover:bg-sky-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
                >
                  Import guest data
                </button>
              ) : null}
            </div>
          }
        />

        <MobileTabs activeTab={activeTab} onChange={setActiveTab} />

        <div className="space-y-4 sm:hidden">
          {activeTab === "today" ? (
            <ChecklistPanel
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              goalsForDate={goalsForDate}
              isHydrated={isHydrated}
              onAddGoal={(text) => updateAndPersist((current) => addGoal(current, selectedDate, { text }))}
              onToggle={(goalId) =>
                updateAndPersist((current) => toggleGoalCompleted(current, selectedDate, goalId))
              }
              onDelete={(goalId) => updateAndPersist((current) => deleteGoal(current, selectedDate, goalId))}
              onUpdateText={(goalId, newText) =>
                updateAndPersist((current) => updateGoalText(current, selectedDate, goalId, newText))
              }
              onClearCompleted={() =>
                updateAndPersist((current) => clearCompleted(current, selectedDate))
              }
            />
          ) : null}

          {activeTab === "progress" ? (
            <ProgressPanel
              goalsByDate={goalsByDate}
              selectedDate={selectedDate}
              onSelectDate={(nextDate) => {
                setSelectedDate(nextDate);
                setActiveTab("today");
              }}
            />
          ) : null}

          {activeTab === "settings" ? (
            <SettingsPanel
              loading={loading}
              isConfigured={isConfigured}
              userLabel={userLabel}
              onSignIn={signIn}
              onSignOut={signOut}
              canImportGuestData={canImportGuestData}
              onImportGuestData={handleImportGuestData}
              statusMessage={statusMessage}
            />
          ) : null}
        </div>

        <div className="hidden sm:grid sm:gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <ChecklistPanel
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            goalsForDate={goalsForDate}
            isHydrated={isHydrated}
            onAddGoal={(text) => updateAndPersist((current) => addGoal(current, selectedDate, { text }))}
            onToggle={(goalId) =>
              updateAndPersist((current) => toggleGoalCompleted(current, selectedDate, goalId))
            }
            onDelete={(goalId) => updateAndPersist((current) => deleteGoal(current, selectedDate, goalId))}
            onUpdateText={(goalId, newText) =>
              updateAndPersist((current) => updateGoalText(current, selectedDate, goalId, newText))
            }
            onClearCompleted={() => updateAndPersist((current) => clearCompleted(current, selectedDate))}
          />

          <aside>
            <ProgressPanel goalsByDate={goalsByDate} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
          </aside>
        </div>
      </div>
    </main>
  );
}
