import { NextRequest, NextResponse } from "next/server";
import { requireUid } from "@/lib/server/auth";
import { isDateKey, jsonError } from "@/lib/server/api";
import { resolveEffectiveGoalsForDate } from "@/lib/server/effectiveGoals";
import { prisma } from "@/lib/server/prisma";

export const runtime = "nodejs";

type CreateGoalBody = {
  date?: string;
  text?: string;
};

function toClientGoal(goal: {
  id: string;
  date: string;
  text: string;
  completed: boolean;
  createdAt: Date;
  completedAt: Date | null;
}) {
  return {
    kind: "oneTime" as const,
    id: goal.id,
    uiKey: `oneTime:${goal.id}`,
    date: goal.date,
    text: goal.text,
    completed: goal.completed,
    isOverride: false,
    createdAt: goal.createdAt.toISOString(),
    completedAt: goal.completedAt ? goal.completedAt.getTime() : undefined
  };
}

function shiftDateKey(dateKey: string, deltaDays: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + deltaDays);
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 10);
}

function dateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  let current = startDate;
  while (current <= endDate) {
    dates.push(current);
    current = shiftDateKey(current, 1);
  }
  return dates;
}

function handleRouteError(error: unknown) {
  if (error instanceof Error && error.message === "Missing bearer token") {
    return jsonError("Missing bearer token", 401);
  }

  if (error instanceof Error && error.message === "Invalid token") {
    return jsonError("Invalid token", 401);
  }

  if (error instanceof Error && error.message === "Server auth not configured") {
    return jsonError("Server auth not configured", 500);
  }

  console.error("Goals route error", error);
  return jsonError("Internal server error.", 500);
}

export async function GET(request: NextRequest) {
  try {
    const { uid } = await requireUid(request);
    const date = request.nextUrl.searchParams.get("date");
    const startDate = request.nextUrl.searchParams.get("startDate");
    const endDate = request.nextUrl.searchParams.get("endDate");

    if (date && !isDateKey(date)) {
      return jsonError("Invalid date format.", 400);
    }

    if (startDate && !isDateKey(startDate)) {
      return jsonError("Invalid startDate format.", 400);
    }

    if (endDate && !isDateKey(endDate)) {
      return jsonError("Invalid endDate format.", 400);
    }

    if ((startDate && !endDate) || (!startDate && endDate)) {
      return jsonError("Both startDate and endDate are required together.", 400);
    }

    if (startDate && endDate && startDate > endDate) {
      return jsonError("startDate must be before or equal to endDate.", 400);
    }

    if (date) {
      const [oneTimeGoals, series, overrides, completions] = await Promise.all([
        prisma.goal.findMany({
          where: { uid, date },
          orderBy: { createdAt: "asc" }
        }),
        prisma.goalSeries.findMany({
          where: {
            uid,
            startDate: { lte: date },
            OR: [{ endDate: null }, { endDate: { gte: date } }]
          },
          orderBy: { createdAt: "asc" }
        }),
        prisma.goalOccurrenceOverride.findMany({
          where: { uid, date }
        }),
        prisma.goalCompletion.findMany({
          where: { uid, date, seriesId: { not: null } }
        })
      ]);

      const effective = resolveEffectiveGoalsForDate({
        date,
        oneTimeGoals,
        series,
        overrides,
        completions
      });

      return NextResponse.json(effective);
    }

    if (startDate && endDate) {
      const [oneTimeGoals, series, overrides, completions] = await Promise.all([
        prisma.goal.findMany({
          where: { uid, date: { gte: startDate, lte: endDate } },
          orderBy: { createdAt: "asc" }
        }),
        prisma.goalSeries.findMany({
          where: {
            uid,
            startDate: { lte: endDate },
            OR: [{ endDate: null }, { endDate: { gte: startDate } }]
          },
          orderBy: { createdAt: "asc" }
        }),
        prisma.goalOccurrenceOverride.findMany({
          where: { uid, date: { gte: startDate, lte: endDate } }
        }),
        prisma.goalCompletion.findMany({
          where: { uid, date: { gte: startDate, lte: endDate }, seriesId: { not: null } }
        })
      ]);

      const byDate = dateRange(startDate, endDate).flatMap((rangeDate) =>
        resolveEffectiveGoalsForDate({
          date: rangeDate,
          oneTimeGoals: oneTimeGoals.filter((goal) => goal.date === rangeDate),
          series,
          overrides: overrides.filter((item) => item.date === rangeDate),
          completions: completions.filter((item) => item.date === rangeDate)
        })
      );

      return NextResponse.json(byDate);
    }

    const goals = await prisma.goal.findMany({
      where: { uid },
      orderBy: { createdAt: "asc" }
    });

    return NextResponse.json(goals.map(toClientGoal));
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { uid, decodedToken } = await requireUid(request);
    const body = (await request.json()) as CreateGoalBody;
    const date = body.date ?? "";
    const text = body.text?.trim() ?? "";

    if (!isDateKey(date)) {
      return jsonError("Invalid date format.", 400);
    }

    if (!text) {
      return jsonError("Text is required.", 400);
    }

    await prisma.user.upsert({
      where: { uid },
      update: {},
      create: {
        uid,
        email: typeof decodedToken.email === "string" ? decodedToken.email : null,
        displayName: typeof decodedToken.name === "string" ? decodedToken.name : null,
        photoURL: typeof decodedToken.picture === "string" ? decodedToken.picture : null
      }
    });

    const goal = await prisma.goal.create({
      data: {
        uid,
        date,
        text,
        completed: false
      }
    });

    return NextResponse.json(toClientGoal(goal), { status: 201 });
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}
