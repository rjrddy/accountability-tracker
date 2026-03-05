import { NextRequest, NextResponse } from "next/server";
import { requireUid } from "@/lib/server/auth";
import { jsonError } from "@/lib/server/api";
import { prisma } from "@/lib/server/prisma";
import { isDateKey } from "@/lib/tasks/seriesValidation";

type OccurrenceAction = "complete" | "uncomplete" | "skip" | "unskip" | "overrideText";

type OccurrenceBody = {
  date?: string;
  action?: OccurrenceAction;
  text?: string;
};

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

  console.error("Series occurrence route error", error);
  return jsonError("Internal server error.", 500);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { uid } = await requireUid(request);
    const { id } = await context.params;
    const body = (await request.json()) as OccurrenceBody;
    const date = body.date ?? "";
    const action = body.action;

    if (!isDateKey(date)) {
      return jsonError("Invalid date format.", 400);
    }

    if (
      action !== "complete" &&
      action !== "uncomplete" &&
      action !== "skip" &&
      action !== "unskip" &&
      action !== "overrideText"
    ) {
      return jsonError("Invalid action.", 400);
    }

    const series = await prisma.goalSeries.findFirst({ where: { id, uid } });
    if (!series) {
      return jsonError("Series not found.", 404);
    }

    if (action === "complete" || action === "uncomplete") {
      const completion = await prisma.goalCompletion.upsert({
        where: {
          uid_date_seriesId: {
            uid,
            date,
            seriesId: id
          }
        },
        update: {
          completed: action === "complete",
          completedAt: action === "complete" ? new Date() : null
        },
        create: {
          uid,
          date,
          seriesId: id,
          completed: action === "complete",
          completedAt: action === "complete" ? new Date() : null
        }
      });

      return NextResponse.json({ ok: true, completion });
    }

    if (action === "skip" || action === "unskip") {
      const existing = await prisma.goalOccurrenceOverride.findUnique({
        where: { seriesId_date: { seriesId: id, date } }
      });

      if (!existing) {
        const created = await prisma.goalOccurrenceOverride.create({
          data: {
            uid,
            seriesId: id,
            date,
            isSkipped: action === "skip"
          }
        });
        return NextResponse.json({ ok: true, override: created });
      }

      const nextSkipped = action === "skip";
      if (!nextSkipped && !existing.overrideText) {
        await prisma.goalOccurrenceOverride.delete({ where: { id: existing.id } });
        return NextResponse.json({ ok: true, override: null });
      }

      const updated = await prisma.goalOccurrenceOverride.update({
        where: { id: existing.id },
        data: { isSkipped: nextSkipped }
      });
      return NextResponse.json({ ok: true, override: updated });
    }

    const rawText = body.text;
    const text = typeof rawText === "string" ? rawText.trim() : "";
    const existing = await prisma.goalOccurrenceOverride.findUnique({
      where: { seriesId_date: { seriesId: id, date } }
    });

    if (!existing) {
      if (!text) {
        return NextResponse.json({ ok: true, override: null });
      }

      const created = await prisma.goalOccurrenceOverride.create({
        data: {
          uid,
          seriesId: id,
          date,
          overrideText: text
        }
      });
      return NextResponse.json({ ok: true, override: created });
    }

    if (!text && !existing.isSkipped) {
      await prisma.goalOccurrenceOverride.delete({ where: { id: existing.id } });
      return NextResponse.json({ ok: true, override: null });
    }

    const updated = await prisma.goalOccurrenceOverride.update({
      where: { id: existing.id },
      data: { overrideText: text || null }
    });
    return NextResponse.json({ ok: true, override: updated });
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}
