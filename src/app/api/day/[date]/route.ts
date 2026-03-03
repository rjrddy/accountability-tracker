import { NextRequest, NextResponse } from "next/server";
import { requireUid } from "@/lib/server/auth";
import { isDateKey, jsonError } from "@/lib/server/api";
import { prisma } from "@/lib/server/prisma";

type PutDayBody = {
  notes?: string;
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ date: string }> }
) {
  try {
    const { uid } = await requireUid(request);
    const { date } = await context.params;

    if (!isDateKey(date)) {
      return jsonError("Invalid date format.", 400);
    }

    const note = await prisma.dayNote.findUnique({
      where: { uid_date: { uid, date } }
    });

    return NextResponse.json({
      date,
      notes: note?.notes ?? "",
      updatedAt: note?.updatedAt ?? null
    });
  } catch {
    return jsonError("Unauthorized", 401);
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ date: string }> }
) {
  try {
    const { uid } = await requireUid(request);
    const { date } = await context.params;
    const body = (await request.json()) as PutDayBody;

    if (!isDateKey(date)) {
      return jsonError("Invalid date format.", 400);
    }

    const notes = typeof body.notes === "string" ? body.notes : "";

    const saved = await prisma.dayNote.upsert({
      where: { uid_date: { uid, date } },
      update: { notes },
      create: { uid, date, notes }
    });

    return NextResponse.json({
      date: saved.date,
      notes: saved.notes,
      updatedAt: saved.updatedAt
    });
  } catch {
    return jsonError("Unauthorized", 401);
  }
}
