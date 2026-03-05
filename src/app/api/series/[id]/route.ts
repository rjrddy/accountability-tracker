import { NextRequest, NextResponse } from "next/server";
import { requireUid } from "@/lib/server/auth";
import { jsonError } from "@/lib/server/api";
import { prisma } from "@/lib/server/prisma";
import { parseSeriesInput } from "@/lib/tasks/seriesValidation";

export const runtime = "nodejs";

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

  console.error("Series item route error", error);
  return jsonError("Internal server error.", 500);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { uid } = await requireUid(request);
    const { id } = await context.params;
    const existing = await prisma.goalSeries.findFirst({ where: { id, uid } });
    if (!existing) {
      return jsonError("Series not found.", 404);
    }

    const body = (await request.json()) as Record<string, unknown>;
    const parsed = parseSeriesInput({
      text: typeof body.text === "string" ? body.text : existing.text,
      recurrenceType:
        typeof body.recurrenceType === "string" ? body.recurrenceType : existing.recurrenceType,
      interval: typeof body.interval === "number" ? body.interval : existing.interval,
      daysOfWeek: body.daysOfWeek ?? existing.daysOfWeek,
      dayOfMonth: body.dayOfMonth ?? existing.dayOfMonth,
      startDate: typeof body.startDate === "string" ? body.startDate : existing.startDate,
      endDate:
        body.endDate === null || typeof body.endDate === "string" ? body.endDate : existing.endDate
    });

    if (!parsed.ok) {
      return jsonError(parsed.error, 400);
    }

    const updated = await prisma.goalSeries.update({
      where: { id },
      data: {
        text: parsed.data.text,
        recurrenceType: parsed.data.recurrenceType,
        interval: parsed.data.interval,
        daysOfWeek: parsed.data.daysOfWeek,
        dayOfMonth: parsed.data.dayOfMonth,
        startDate: parsed.data.startDate,
        endDate: parsed.data.endDate
      }
    });

    return NextResponse.json(updated);
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
    const existing = await prisma.goalSeries.findFirst({ where: { id, uid } });
    if (!existing) {
      return jsonError("Series not found.", 404);
    }

    await prisma.goalSeries.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}
