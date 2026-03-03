const LEGACY_STORAGE_KEY = "daily-goals-by-date";
const STORAGE_PREFIX = "goals";
export const STORAGE_KEY = `${STORAGE_PREFIX}:guest`;

export type Goal = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
};

export type GoalsByDate = Record<string, Goal[]>;

export type NewGoalInput = {
  text: string;
};

export function getStorageKey(uid: string | null | undefined): string {
  return `${STORAGE_PREFIX}:${uid ?? "guest"}`;
}

function safeParseGoals(rawValue: string): GoalsByDate {
  try {
    const parsed = JSON.parse(rawValue) as unknown;
    if (!parsed || typeof parsed !== "object") {
      return {};
    }

    const result: GoalsByDate = {};

    for (const [date, goals] of Object.entries(parsed)) {
      if (!Array.isArray(goals)) {
        continue;
      }

      const cleanedGoals = goals
        .filter((goal): goal is Goal => {
          if (!goal || typeof goal !== "object") {
            return false;
          }

          const candidate = goal as Partial<Goal>;
          return (
            typeof candidate.id === "string" &&
            typeof candidate.text === "string" &&
            typeof candidate.completed === "boolean" &&
            typeof candidate.createdAt === "string"
          );
        })
        .map((goal) => ({
          id: goal.id,
          text: goal.text,
          completed: goal.completed,
          createdAt: goal.createdAt
        }));

      result[date] = cleanedGoals;
    }

    return result;
  } catch {
    return {};
  }
}

export function loadGoalsByDate(storageKey = STORAGE_KEY): GoalsByDate {
  if (typeof window === "undefined") {
    return {};
  }

  const saved = window.localStorage.getItem(storageKey);
  if (!saved) {
    if (storageKey === STORAGE_KEY) {
      const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
      return legacy ? safeParseGoals(legacy) : {};
    }

    return {};
  }

  return safeParseGoals(saved);
}

export function saveGoalsByDate(goalsByDate: GoalsByDate, storageKey = STORAGE_KEY): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(storageKey, JSON.stringify(goalsByDate));
}

export function getGoalsForDate(goalsByDate: GoalsByDate, dateKey: string): Goal[] {
  return goalsByDate[dateKey] ?? [];
}

function createGoalId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `goal-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

export function addGoal(goalsByDate: GoalsByDate, dateKey: string, input: NewGoalInput): GoalsByDate {
  const trimmedText = input.text.trim();
  if (!trimmedText) {
    return goalsByDate;
  }

  const nextGoal: Goal = {
    id: createGoalId(),
    text: trimmedText,
    completed: false,
    createdAt: new Date().toISOString()
  };

  const existingGoals = getGoalsForDate(goalsByDate, dateKey);

  return {
    ...goalsByDate,
    [dateKey]: [...existingGoals, nextGoal]
  };
}

export function updateGoalText(
  goalsByDate: GoalsByDate,
  dateKey: string,
  goalId: string,
  newText: string
): GoalsByDate {
  const trimmedText = newText.trim();
  if (!trimmedText) {
    return goalsByDate;
  }

  const goals = getGoalsForDate(goalsByDate, dateKey);

  const updatedGoals = goals.map((goal) => {
    if (goal.id !== goalId) {
      return goal;
    }

    return {
      ...goal,
      text: trimmedText
    };
  });

  return {
    ...goalsByDate,
    [dateKey]: updatedGoals
  };
}

export function toggleGoalCompleted(goalsByDate: GoalsByDate, dateKey: string, goalId: string): GoalsByDate {
  const goals = getGoalsForDate(goalsByDate, dateKey);

  const updatedGoals = goals.map((goal) => {
    if (goal.id !== goalId) {
      return goal;
    }

    return {
      ...goal,
      completed: !goal.completed
    };
  });

  return {
    ...goalsByDate,
    [dateKey]: updatedGoals
  };
}

export function deleteGoal(goalsByDate: GoalsByDate, dateKey: string, goalId: string): GoalsByDate {
  const goals = getGoalsForDate(goalsByDate, dateKey);
  const updatedGoals = goals.filter((goal) => goal.id !== goalId);

  return {
    ...goalsByDate,
    [dateKey]: updatedGoals
  };
}

export function clearCompleted(goalsByDate: GoalsByDate, dateKey: string): GoalsByDate {
  const goals = getGoalsForDate(goalsByDate, dateKey);
  const remainingGoals = goals.filter((goal) => !goal.completed);

  return {
    ...goalsByDate,
    [dateKey]: remainingGoals
  };
}

export function getProgress(goals: Goal[]): { completed: number; total: number; percentage: number } {
  const total = goals.length;
  const completed = goals.filter((goal) => goal.completed).length;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  return { completed, total, percentage };
}
