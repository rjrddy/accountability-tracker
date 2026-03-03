import { NextRequest, NextResponse } from "next/server";
import { requireUid } from "@/lib/server/auth";
import { jsonError } from "@/lib/server/api";
import { prisma } from "@/lib/server/prisma";

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
  } catch {
    return jsonError("Unauthorized", 401);
  }
}
