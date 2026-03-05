import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { requireUid } from "@/lib/server/auth";
import { jsonError } from "@/lib/server/api";
import { prisma } from "@/lib/server/prisma";
import { normalizeUsername, validateUsername } from "@/lib/validation/username";

type RequestBody = {
  username?: string;
};

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { uid, decodedToken } = await requireUid(request);
    const body = (await request.json()) as RequestBody;
    const username = body.username ?? "";
    const validationError = validateUsername(username);
    if (validationError) {
      return jsonError(validationError, 400);
    }

    const email = typeof decodedToken.email === "string" ? decodedToken.email : null;
    const displayName = typeof decodedToken.name === "string" ? decodedToken.name : null;
    const photoURL = typeof decodedToken.picture === "string" ? decodedToken.picture : null;

    await prisma.user.upsert({
      where: { uid },
      update: {},
      create: { uid, email, displayName, photoURL }
    });

    const normalized = normalizeUsername(username);

    const updated = await prisma.user.update({
      where: { uid },
      data: {
        username: username.trim(),
        usernameLower: normalized
      }
    });

    return NextResponse.json({
      uid: updated.uid,
      username: updated.username,
      displayName: updated.displayName,
      photoURL: updated.photoURL
    });
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return jsonError("Username already taken.", 409);
    }

    if (error instanceof Error && error.message === "Missing bearer token") {
      return jsonError("Missing bearer token", 401);
    }

    if (error instanceof Error && error.message === "Invalid token") {
      return jsonError("Invalid token", 401);
    }

    if (error instanceof Error && error.message === "Server auth not configured") {
      return jsonError("Server auth not configured", 500);
    }

    return jsonError("Failed to update username.", 500);
  }
}
