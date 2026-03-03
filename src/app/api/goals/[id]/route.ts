import { NextRequest, NextResponse } from "next/server";
import { requireUid } from "@/lib/server/auth";
import { jsonError } from "@/lib/server/api";
import { prisma } from "@/lib/server/prisma";

type UpdateGoalBody = {
  text?: string;
  completed?: boolean;
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
  } catch {
    return jsonError("Unauthorized", 401);
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
  } catch {
    return jsonError("Unauthorized", 401);
  }
}
