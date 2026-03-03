import { NextRequest, NextResponse } from "next/server";
import { requireUid } from "@/lib/server/auth";
import { isDateKey, jsonError } from "@/lib/server/api";
import { prisma } from "@/lib/server/prisma";

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
    id: goal.id,
    date: goal.date,
    text: goal.text,
    completed: goal.completed,
    createdAt: goal.createdAt.toISOString(),
    completedAt: goal.completedAt ? goal.completedAt.getTime() : undefined
  };
}

export async function GET(request: NextRequest) {
  try {
    const { uid } = await requireUid(request);
    const date = request.nextUrl.searchParams.get("date");

    if (date && !isDateKey(date)) {
      return jsonError("Invalid date format.", 400);
    }

    const goals = await prisma.goal.findMany({
      where: date ? { uid, date } : { uid },
      orderBy: { createdAt: "asc" }
    });

    return NextResponse.json(goals.map(toClientGoal));
  } catch {
    return jsonError("Unauthorized", 401);
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
  } catch {
    return jsonError("Unauthorized", 401);
  }
}
