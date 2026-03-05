import { NextRequest, NextResponse } from "next/server";
import { requireUid } from "@/lib/server/auth";
import { jsonError } from "@/lib/server/api";
import { prisma } from "@/lib/server/prisma";

export const runtime = "nodejs";

type UpdateGoalBody = {
  text?: string;
  completed?: boolean;
};

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

  console.error("Goal item route error", error);
  return jsonError("Internal server error.", 500);
}

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

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { uid } = await requireUid(request);
    const { id } = await context.params;
    const body = (await request.json()) as UpdateGoalBody;

    const existing = await prisma.goal.findFirst({ where: { id, uid } });
    if (!existing) {
      return jsonError("Goal not found.", 404);
    }

    const data: {
      text?: string;
      completed?: boolean;
      completedAt?: Date | null;
    } = {};

    if (typeof body.text === "string") {
      const trimmed = body.text.trim();
      if (!trimmed) {
        return jsonError("Text cannot be empty.", 400);
      }
      data.text = trimmed;
    }

    if (typeof body.completed === "boolean") {
      data.completed = body.completed;
      if (body.completed && !existing.completed) {
        data.completedAt = new Date();
      } else if (!body.completed) {
        data.completedAt = null;
      }
    }

    const updated = await prisma.goal.update({
      where: { id },
      data
    });

    return NextResponse.json(toClientGoal(updated));
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { uid } = await requireUid(request);
    const { id } = await context.params;
    const existing = await prisma.goal.findFirst({ where: { id, uid } });
    if (!existing) {
      return jsonError("Goal not found.", 404);
    }

    await prisma.goal.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}
