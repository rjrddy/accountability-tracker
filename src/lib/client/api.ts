"use client";

import type { User } from "firebase/auth";
import type { Goal, GoalsByDate } from "@/lib/goalsStore";

export type MeProfile = {
  uid: string;
  username: string | null;
  displayName: string | null;
  photoURL: string | null;
};

export type ApiGoal = Goal & {
  date: string;
  kind: "oneTime" | "recurring";
  uiKey: string;
  recurrenceType?: "NONE" | "DAILY" | "WEEKLY" | "MONTHLY";
  isOverride?: boolean;
};

function mergeHeaders(base: HeadersInit, next?: HeadersInit): Headers {
  const merged = new Headers(base);
  if (!next) {
    return merged;
  }
  const nextHeaders = new Headers(next);
  nextHeaders.forEach((value, key) => merged.set(key, value));
  return merged;
}

export async function buildAuthHeaders(
  user: User,
  options?: { forceRefresh?: boolean; headers?: HeadersInit }
): Promise<Headers> {
  const token = await user.getIdToken(Boolean(options?.forceRefresh));
  return mergeHeaders(
    {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    options?.headers
  );
}

async function authedFetch(user: User, input: string, init?: RequestInit): Promise<Response> {
  const initialHeaders = await buildAuthHeaders(user, { headers: init?.headers });
  const firstResponse = await fetch(input, {
    ...init,
    headers: initialHeaders
  });

  if (firstResponse.status !== 401) {
    return firstResponse;
  }

  const retryHeaders = await buildAuthHeaders(user, {
    forceRefresh: true,
    headers: init?.headers
  });
  return fetch(input, {
    ...init,
    headers: retryHeaders
  });
}

async function parseOrThrow<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    const baseMessage = body.error ?? response.statusText ?? "Request failed";
    throw new Error(`HTTP ${response.status}: ${baseMessage}`);
  }

  return (await response.json()) as T;
}

export function goalsArrayToByDate(goals: ApiGoal[]): GoalsByDate {
  return goals.reduce<GoalsByDate>((acc, goal) => {
    const dateKey = goal.date;
    const current = acc[dateKey] ?? [];
    acc[dateKey] = [...current, goal];
    return acc;
  }, {});
}

export async function fetchMe(user: User): Promise<MeProfile> {
  const response = await authedFetch(user, "/api/me");
  return parseOrThrow<MeProfile>(response);
}

export async function updateUsername(user: User, username: string): Promise<MeProfile> {
  const response = await authedFetch(user, "/api/username", {
    method: "POST",
    body: JSON.stringify({ username })
  });
  return parseOrThrow<MeProfile>(response);
}

export async function fetchAllGoals(user: User): Promise<ApiGoal[]> {
  const response = await authedFetch(user, "/api/goals");
  return parseOrThrow<ApiGoal[]>(response);
}

export async function fetchGoalsForDate(user: User, date: string): Promise<ApiGoal[]> {
  const response = await authedFetch(user, `/api/goals?date=${encodeURIComponent(date)}`);
  return parseOrThrow<ApiGoal[]>(response);
}

export async function fetchGoalsRange(
  user: User,
  startDate: string,
  endDate: string
): Promise<ApiGoal[]> {
  const response = await authedFetch(
    user,
    `/api/goals?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`
  );
  return parseOrThrow<ApiGoal[]>(response);
}

export async function createGoal(user: User, date: string, text: string): Promise<Goal> {
  const response = await authedFetch(user, "/api/goals", {
    method: "POST",
    body: JSON.stringify({ date, text })
  });
  return parseOrThrow<Goal>(response);
}

export async function patchGoal(
  user: User,
  goalId: string,
  payload: { text?: string; completed?: boolean }
): Promise<Goal> {
  const response = await authedFetch(user, `/api/goals/${goalId}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
  return parseOrThrow<Goal>(response);
}

export async function removeGoal(user: User, goalId: string): Promise<void> {
  const response = await authedFetch(user, `/api/goals/${goalId}`, { method: "DELETE" });
  await parseOrThrow<{ ok: true }>(response);
}

export async function createSeries(
  user: User,
  payload: {
    text: string;
    recurrenceType: "DAILY" | "WEEKLY" | "MONTHLY";
    startDate: string;
    daysOfWeek?: number[];
    dayOfMonth?: number;
  }
): Promise<void> {
  const response = await authedFetch(user, "/api/series", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  await parseOrThrow(response);
}

export async function updateSeries(
  user: User,
  seriesId: string,
  payload: {
    text?: string;
    recurrenceType?: "DAILY" | "WEEKLY" | "MONTHLY";
    startDate?: string;
    endDate?: string | null;
    daysOfWeek?: number[];
    dayOfMonth?: number;
    interval?: number;
  }
): Promise<void> {
  const response = await authedFetch(user, `/api/series/${seriesId}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
  await parseOrThrow(response);
}

export async function deleteSeries(user: User, seriesId: string): Promise<void> {
  const response = await authedFetch(user, `/api/series/${seriesId}`, {
    method: "DELETE"
  });
  await parseOrThrow<{ ok: true }>(response);
}

export async function mutateSeriesOccurrence(
  user: User,
  seriesId: string,
  payload: {
    date: string;
    action: "complete" | "uncomplete" | "skip" | "unskip" | "overrideText";
    text?: string;
  }
): Promise<void> {
  const response = await authedFetch(user, `/api/series/${seriesId}/occurrence`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
  await parseOrThrow(response);
}
