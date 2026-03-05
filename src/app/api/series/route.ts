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

  console.error("Series route error", error);
  return jsonError("Internal server error.", 500);
}

export async function GET(request: NextRequest) {
  try {
    const { uid } = await requireUid(request);
    const series = await prisma.goalSeries.findMany({
      where: { uid },
      orderBy: { createdAt: "asc" }
    });
    return NextResponse.json(series);
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { uid, decodedToken } = await requireUid(request);
    const body = (await request.json()) as Record<string, unknown>;
    const parsed = parseSeriesInput(body);

    if (!parsed.ok) {
      return jsonError(parsed.error, 400);
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

    const created = await prisma.goalSeries.create({
      data: {
        uid,
        text: parsed.data.text,
        recurrenceType: parsed.data.recurrenceType,
        interval: parsed.data.interval,
        daysOfWeek: parsed.data.daysOfWeek,
        dayOfMonth: parsed.data.dayOfMonth,
        startDate: parsed.data.startDate,
        endDate: parsed.data.endDate
      }
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}
