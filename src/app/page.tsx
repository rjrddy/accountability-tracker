"use client";

import { useEffect, useMemo, useState } from "react";
import AddGoalForm, { type AddGoalInput } from "@/components/AddGoalForm";
import ContributionGrid from "@/components/analytics/ContributionGrid";
import ProgressCards from "@/components/analytics/ProgressCards";
import TrendsChart from "@/components/analytics/TrendsChart";
import AuthButtons from "@/components/auth/AuthButtons";
import UsernameModal from "@/components/auth/UsernameModal";
import FriendsPage from "@/components/friends/FriendsPage";
import GoalList from "@/components/GoalList";
import Header from "@/components/layout/Header";
import MobileTabs, { type MobileTab } from "@/components/layout/MobileTabs";
import { useAuth } from "@/context/AuthContext";
import {
  createSeries,
  createGoal as createGoalApi,
  deleteSeries,
  fetchGoalsForDate,
  fetchGoalsRange,
  fetchMe,
  goalsArrayToByDate,
  mutateSeriesOccurrence,
  type MeProfile,
  patchGoal,
  removeGoal,
  updateSeries,
  updateUsername
} from "@/lib/client/api";
import {
  clearCompleted,
  createGuestGoalForDate,
  deleteGoal,
  getGoalsForDate,
  getProgress,
  getStorageKey,
  loadGoalsByDate,
  saveGoalsByDate,
  toggleGoalCompleted,
  updateGoalText,
  type Goal,
  type GoalsByDate
} from "@/lib/goalsStore";
import { createMockSocialAdapter } from "@/lib/social/mockSocialAdapter";
import { validateUsername } from "@/lib/validation/username";

function getDateKey(date: Date): string {
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().split("T")[0];
}

function getTodayDateKey(): string {
  return getDateKey(new Date());
}

function shiftDateKey(dateKey: string, deltaDays: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + deltaDays);
  return getDateKey(date);
}

function hasAnyGoals(goalsByDate: GoalsByDate): boolean {
  return Object.values(goalsByDate).some((goals) => goals.length > 0);
}

function getAnalyticsStartDate(): string {
  return shiftDateKey(getTodayDateKey(), -364);
}

function getWeekday(dateKey: string): number {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day).getDay();
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Request failed.";
}

function ChecklistPanel({
  selectedDate,
  mode,
  authLoading,
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
  mode: "guest" | "signed-in";
  authLoading: boolean;
  onDateChange: (date: string) => void;
  goalsForDate: ReturnType<typeof getGoalsForDate>;
  isHydrated: boolean;
  onAddGoal: (input: AddGoalInput) => Promise<void>;
  onToggle: (goal: Goal) => void;
  onDelete: (goal: Goal, scope?: "occurrence" | "series") => void;
  onUpdateText: (goal: Goal, nextText: string, scope?: "occurrence" | "series") => void;
  onClearCompleted: () => void;
}) {
  const { completed, total, percentage } = getProgress(goalsForDate);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <h2 className="text-xl font-semibold tracking-tight text-slate-900">Daily Goals</h2>
      <p className="mt-2 text-sm text-slate-600">Track what matters for each day.</p>

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <label htmlFor="goal-date" className="flex min-w-[240px] flex-1 items-center gap-2">
            <span className="text-sm font-medium text-slate-700">Date</span>
            <button
              type="button"
              onClick={() => onDateChange(shiftDateKey(selectedDate, -1))}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
              aria-label="Previous day"
            >
              ←
            </button>
            <input
              id="goal-date"
              type="date"
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
              value={selectedDate}
              onChange={(event) => onDateChange(event.target.value)}
              aria-label="Select date"
            />
            <button
              type="button"
              onClick={() => onDateChange(shiftDateKey(selectedDate, 1))}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
              aria-label="Next day"
            >
              →
            </button>
          </label>

          <p
            className="inline-flex h-10 items-center rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700"
            aria-live="polite"
          >
            {completed}/{total} • {percentage}%
          </p>

          <button
            type="button"
            className="inline-flex h-10 items-center rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:ml-auto"
            onClick={onClearCompleted}
            disabled={!goalsForDate.some((goal) => goal.completed)}
          >
            Clear completed
          </button>
        </div>

        <div className="mt-3">
          <AddGoalForm
            selectedDate={selectedDate}
            mode={mode}
            authLoading={authLoading}
            onAddGoal={onAddGoal}
          />
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
  initError,
  userLabel,
  username,
  usernameInput,
  usernameError,
  usernameSaving,
  onUsernameChange,
  onSaveUsername,
  onSignIn,
  onSignOut,
  canImportGuestData,
  onImportGuestData,
  statusMessage
}: {
  loading: boolean;
  isConfigured: boolean;
  initError: string | null;
  userLabel: string | null;
  username: string | null;
  usernameInput: string;
  usernameError: string | null;
  usernameSaving: boolean;
  onUsernameChange: (value: string) => void;
  onSaveUsername: () => void;
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
          initError={initError}
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

        {userLabel ? (
          <div className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Username</p>
            <p className="mt-1 text-sm font-medium text-slate-800">{username ? `@${username}` : "Not set"}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={usernameInput}
                onChange={(event) => onUsernameChange(event.target.value)}
                className="h-10 min-w-[220px] flex-1 rounded-md border border-slate-300 bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                placeholder="Set username"
              />
              <button
                type="button"
                disabled={usernameSaving}
                onClick={onSaveUsername}
                className="inline-flex h-10 items-center rounded-md bg-slate-900 px-3 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {usernameSaving ? "Saving..." : "Save username"}
              </button>
            </div>
            {usernameError ? <p className="mt-1 text-xs text-red-600">{usernameError}</p> : null}
          </div>
        ) : null}

        {statusMessage ? <p className="text-xs text-slate-500">{statusMessage}</p> : null}
      </div>
    </section>
  );
}

export default function HomePage() {
  const { user, loading, isConfigured, initError, signIn, signOut } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateKey());
  const [goalsByDate, setGoalsByDate] = useState<GoalsByDate>({});
  const [isHydrated, setIsHydrated] = useState(false);
  const [activeTab, setActiveTab] = useState<MobileTab>("today");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [usernameInput, setUsernameInput] = useState("");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameSaving, setUsernameSaving] = useState(false);
  const [requireUsername, setRequireUsername] = useState(false);
  const [serverUsername, setServerUsername] = useState<string | null>(null);
  const [meProfile, setMeProfile] = useState<MeProfile | null>(null);
  const storageKey = useMemo(() => getStorageKey(null), []);
  const guestStorageKey = useMemo(() => getStorageKey(null), []);
  const socialAdapter = useMemo(
    () =>
      createMockSocialAdapter({
        uid: meProfile?.uid ?? "guest",
        username: meProfile?.username ?? "guest",
        displayName: meProfile?.displayName ?? "Guest",
        photoURL: meProfile?.photoURL ?? undefined
      }),
    [meProfile?.displayName, meProfile?.photoURL, meProfile?.uid, meProfile?.username]
  );

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
    let cancelled = false;

    const run = async () => {
      setIsHydrated(false);
      setStatusMessage(null);

      if (!user) {
        const loaded = loadGoalsByDate(storageKey);
        if (!cancelled) {
          setGoalsByDate(loaded);
          setRequireUsername(false);
          setServerUsername(null);
          setUsernameInput("");
          setMeProfile({
            uid: "guest",
            username: "guest",
            displayName: "Guest",
            photoURL: null
          });
          setIsHydrated(true);
        }
        return;
      }

      try {
        const rangeStart = getAnalyticsStartDate();
        const today = getTodayDateKey();
        const [profile, rangeGoals] = await Promise.all([
          fetchMe(user),
          fetchGoalsRange(user, rangeStart, today)
        ]);
        if (cancelled) {
          return;
        }

        setServerUsername(profile.username);
        setUsernameInput(profile.username ?? "");
        setMeProfile(profile);
        setRequireUsername(!profile.username);
        setGoalsByDate(goalsArrayToByDate(rangeGoals));
      } catch (error: unknown) {
        if (!cancelled) {
          setStatusMessage((error as Error).message);
        }
      } finally {
        if (!cancelled) {
          setIsHydrated(true);
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [storageKey, user]);

  useEffect(() => {
    if (!user || goalsByDate[selectedDate]) {
      return;
    }

    let cancelled = false;
    const run = async () => {
      try {
        const dailyGoals = await fetchGoalsForDate(user, selectedDate);
        if (cancelled) {
          return;
        }
        setGoalsByDate((current) => ({ ...current, [selectedDate]: dailyGoals }));
      } catch (error: unknown) {
        if (!cancelled) {
          setStatusMessage((error as Error).message);
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [goalsByDate, selectedDate, user]);

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

  const updateGuestState = (updater: (current: GoalsByDate) => GoalsByDate) => {
    setGoalsByDate((current) => {
      const next = updater(current);
      saveGoalsByDate(next, storageKey);
      return next;
    });
  };

  const refreshDate = async (date: string) => {
    if (!user) {
      return;
    }

    const dailyGoals = await fetchGoalsForDate(user, date);
    setGoalsByDate((current) => ({ ...current, [date]: dailyGoals }));
  };

  const refreshAnalyticsRange = async () => {
    if (!user) {
      return;
    }

    const rangeStart = getAnalyticsStartDate();
    const today = getTodayDateKey();
    const rangeGoals = await fetchGoalsRange(user, rangeStart, today);
    setGoalsByDate((current) => ({ ...current, ...goalsArrayToByDate(rangeGoals) }));
  };

  const handleSaveUsername = async () => {
    if (!user) {
      return;
    }

    const validationError = validateUsername(usernameInput);
    if (validationError) {
      setUsernameError(validationError);
      return;
    }

    setUsernameSaving(true);
    setUsernameError(null);

    try {
      const profile = await updateUsername(user, usernameInput);
      setServerUsername(profile.username);
      setUsernameInput(profile.username ?? "");
      setMeProfile(profile);
      setRequireUsername(false);
      setStatusMessage("Username saved.");
    } catch (error: unknown) {
      setUsernameError((error as Error).message);
    } finally {
      setUsernameSaving(false);
    }
  };

  const handleImportGuestData = async () => {
    if (!user) {
      return;
    }

    const guestData = loadGoalsByDate(guestStorageKey);
    if (!hasAnyGoals(guestData)) {
      setStatusMessage("No guest data found.");
      return;
    }

    try {
      for (const [date, goals] of Object.entries(guestData)) {
        for (const goal of goals) {
          const created = await createGoalApi(user, date, goal.text);
          if (goal.completed) {
            await patchGoal(user, created.id, { completed: true });
          }
        }
      }

      await Promise.all([refreshAnalyticsRange(), refreshDate(selectedDate)]);
      setStatusMessage("Imported guest data. Guest data is still preserved locally.");
    } catch (error: unknown) {
      setStatusMessage((error as Error).message);
    }
  };

  const handleAddGoal = async (input: AddGoalInput) => {
    if (loading) {
      const message = "Signing you in...";
      setStatusMessage(message);
      throw new Error(message);
    }

    if (!user) {
      if (input.recurrenceType !== "NONE") {
        const message = "Recurring goals require sign-in.";
        setStatusMessage(message);
        throw new Error(message);
      }
      try {
        const next = createGuestGoalForDate(storageKey, selectedDate, { text: input.text });
        setGoalsByDate(next);
      } catch (error: unknown) {
        const message = toErrorMessage(error);
        setStatusMessage(message);
        throw new Error(message);
      }
      return;
    }

    try {
      if (input.recurrenceType === "NONE") {
        const created = await createGoalApi(user, selectedDate, input.text);
        setGoalsByDate((current) => {
          const existing = current[selectedDate] ?? [];
          return { ...current, [selectedDate]: [...existing, created] };
        });
        return;
      }

      await createSeries(user, {
        text: input.text,
        recurrenceType: input.recurrenceType,
        startDate: selectedDate,
        daysOfWeek:
          input.recurrenceType === "WEEKLY"
            ? input.daysOfWeek && input.daysOfWeek.length > 0
              ? input.daysOfWeek
              : [getWeekday(selectedDate)]
            : undefined,
        dayOfMonth: input.recurrenceType === "MONTHLY" ? input.dayOfMonth : undefined
      });
      await Promise.all([refreshDate(selectedDate), refreshAnalyticsRange()]);
    } catch (error: unknown) {
      const rawMessage = toErrorMessage(error);
      if (rawMessage.includes("HTTP 500: Server auth not configured")) {
        const message =
          "Server authentication is not configured. Check FIREBASE_* env vars on Vercel.";
        setStatusMessage(message);
        throw new Error(message);
      }

      if (rawMessage.startsWith("HTTP 401")) {
        const message = user
          ? "Session expired. We refreshed your token once. Please sign in again."
          : "Please sign in to save to your account.";
        setStatusMessage(message);
        throw new Error(message);
      }

      setStatusMessage(rawMessage);
      throw new Error(rawMessage);
    }
  };

  const handleToggleGoal = async (goal: Goal) => {
    if (!user) {
      updateGuestState((current) => toggleGoalCompleted(current, selectedDate, goal.id));
      return;
    }

    try {
      if (goal.kind === "recurring") {
        await mutateSeriesOccurrence(user, goal.id, {
          date: selectedDate,
          action: goal.completed ? "uncomplete" : "complete"
        });
        await refreshDate(selectedDate);
        return;
      }

      const updated = await patchGoal(user, goal.id, { completed: !goal.completed });
      setGoalsByDate((current) => ({
        ...current,
        [selectedDate]: (current[selectedDate] ?? []).map((item) => (item.id === goal.id ? updated : item))
      }));
    } catch (error: unknown) {
      setStatusMessage((error as Error).message);
    }
  };

  const handleDeleteGoal = async (goal: Goal, scope: "occurrence" | "series" = "occurrence") => {
    if (!user) {
      updateGuestState((current) => deleteGoal(current, selectedDate, goal.id));
      return;
    }

    try {
      if (goal.kind === "recurring") {
        if (scope === "series") {
          await deleteSeries(user, goal.id);
          await Promise.all([refreshDate(selectedDate), refreshAnalyticsRange()]);
          return;
        }
        await mutateSeriesOccurrence(user, goal.id, {
          date: selectedDate,
          action: "skip"
        });
        await refreshDate(selectedDate);
        return;
      }

      await removeGoal(user, goal.id);
      setGoalsByDate((current) => ({
        ...current,
        [selectedDate]: (current[selectedDate] ?? []).filter((item) => item.id !== goal.id)
      }));
    } catch (error: unknown) {
      setStatusMessage((error as Error).message);
    }
  };

  const handleUpdateGoalText = async (
    goal: Goal,
    newText: string,
    scope: "occurrence" | "series" = "occurrence"
  ) => {
    if (!user) {
      updateGuestState((current) => updateGoalText(current, selectedDate, goal.id, newText));
      return;
    }

    try {
      if (goal.kind === "recurring") {
        if (scope === "series") {
          await updateSeries(user, goal.id, { text: newText });
          await Promise.all([refreshDate(selectedDate), refreshAnalyticsRange()]);
          return;
        }

        await mutateSeriesOccurrence(user, goal.id, {
          date: selectedDate,
          action: "overrideText",
          text: newText
        });
        await refreshDate(selectedDate);
        return;
      }

      const updated = await patchGoal(user, goal.id, { text: newText });
      setGoalsByDate((current) => ({
        ...current,
        [selectedDate]: (current[selectedDate] ?? []).map((item) => (item.id === goal.id ? updated : item))
      }));
    } catch (error: unknown) {
      setStatusMessage((error as Error).message);
    }
  };

  const handleClearCompleted = async () => {
    if (!user) {
      updateGuestState((current) => clearCompleted(current, selectedDate));
      return;
    }

    const completedGoals = goalsForDate.filter((goal) => goal.completed);
    try {
      await Promise.all(
        completedGoals.map((goal) => {
          if (goal.kind === "recurring") {
            return mutateSeriesOccurrence(user, goal.id, {
              date: selectedDate,
              action: "uncomplete"
            });
          }
          return removeGoal(user, goal.id);
        })
      );
      await refreshDate(selectedDate);
    } catch (error: unknown) {
      setStatusMessage((error as Error).message);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-5xl">
        <Header
          todayLabel={todayLabel}
          rightSlot={
            <div className="flex items-center gap-2">
              <AuthButtons
                userLabel={userLabel}
                loading={loading}
                isConfigured={isConfigured}
                initError={initError}
                onSignIn={signIn}
                onSignOut={signOut}
              />
              {canImportGuestData ? (
                <button
                  type="button"
                  onClick={() => {
                    void handleImportGuestData();
                  }}
                  className="inline-flex h-9 items-center rounded-md border border-sky-300 bg-sky-50 px-3 text-xs font-medium text-sky-800 transition hover:bg-sky-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
                >
                  Import guest data
                </button>
              ) : null}
            </div>
          }
        />

        <MobileTabs activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === "today" ? (
          <ChecklistPanel
            selectedDate={selectedDate}
            mode={user ? "signed-in" : "guest"}
            authLoading={loading}
            onDateChange={setSelectedDate}
            goalsForDate={goalsForDate}
            isHydrated={isHydrated}
            onAddGoal={async (input) => handleAddGoal(input)}
            onToggle={(goal) => {
              void handleToggleGoal(goal);
            }}
            onDelete={(goal, scope) => {
              void handleDeleteGoal(goal, scope);
            }}
            onUpdateText={(goal, newText, scope) => {
              void handleUpdateGoalText(goal, newText, scope);
            }}
            onClearCompleted={() => {
              void handleClearCompleted();
            }}
          />
        ) : null}

        {activeTab === "progress" ? (
          <ProgressPanel goalsByDate={goalsByDate} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
        ) : null}

        {activeTab === "friends" ? (
          <FriendsPage
            adapter={socialAdapter}
            currentProfile={{
              uid: meProfile?.uid ?? "guest",
              username: meProfile?.username ?? "guest",
              displayName: meProfile?.displayName ?? "Guest",
              photoURL: meProfile?.photoURL ?? undefined
            }}
            myGoalsByDate={goalsByDate}
          />
        ) : null}

        {activeTab === "settings" ? (
          <SettingsPanel
            loading={loading}
            isConfigured={isConfigured}
            initError={initError}
            userLabel={userLabel}
            onSignIn={signIn}
            onSignOut={signOut}
            canImportGuestData={canImportGuestData}
            onImportGuestData={() => {
              void handleImportGuestData();
            }}
            statusMessage={statusMessage}
            username={serverUsername}
            usernameInput={usernameInput}
            usernameError={usernameError}
            usernameSaving={usernameSaving}
            onUsernameChange={(value) => {
              setUsernameInput(value);
              setUsernameError(null);
            }}
            onSaveUsername={() => {
              void handleSaveUsername();
            }}
          />
        ) : null}
      </div>

      {user && requireUsername ? (
        <UsernameModal
          value={usernameInput}
          error={usernameError}
          loading={usernameSaving}
          onChange={(value) => {
            setUsernameInput(value);
            setUsernameError(null);
          }}
          onSubmit={() => {
            void handleSaveUsername();
          }}
        />
      ) : null}
    </main>
  );
}
