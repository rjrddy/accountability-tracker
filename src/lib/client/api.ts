"use client";

import type { User } from "firebase/auth";
import type { Goal, GoalsByDate } from "@/lib/goalsStore";

export type MeProfile = {
  uid: string;
  username: string | null;
  displayName: string | null;
  photoURL: string | null;
};

type ApiGoal = Goal & { date: string };

async function authedFetch(user: User, input: string, init?: RequestInit): Promise<Response> {
  const token = await user.getIdToken();
  return fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {})
    }
  });
}

async function parseOrThrow<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Request failed");
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
