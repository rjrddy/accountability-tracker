import { NextRequest, NextResponse } from "next/server";
import { requireUid } from "@/lib/server/auth";
import { jsonError } from "@/lib/server/api";
import { prisma } from "@/lib/server/prisma";

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

  console.error("Me route error", error);
  return jsonError("Internal server error.", 500);
}

export async function GET(request: NextRequest) {
  try {
    const { uid, decodedToken } = await requireUid(request);
    const email = typeof decodedToken.email === "string" ? decodedToken.email : null;
    const displayName = typeof decodedToken.name === "string" ? decodedToken.name : null;
    const photoURL = typeof decodedToken.picture === "string" ? decodedToken.picture : null;

    const existing = await prisma.user.findUnique({ where: { uid } });
    const user = existing
      ? await prisma.user.update({
          where: { uid },
          data: {
            email: existing.email ?? email,
            displayName: existing.displayName ?? displayName,
            photoURL: existing.photoURL ?? photoURL
          }
        })
      : await prisma.user.create({
          data: {
            uid,
            email,
            displayName,
            photoURL
          }
        });

    return NextResponse.json({
      uid: user.uid,
      username: user.username,
      displayName: user.displayName,
      photoURL: user.photoURL
    });
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}
