import type { NextRequest } from "next/server";
import { adminAuth } from "@/lib/server/firebaseAdmin";

export async function requireUid(request: NextRequest): Promise<{
  uid: string;
  decodedToken: Awaited<ReturnType<typeof adminAuth.verifyIdToken>>;
}> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
    throw new Error("Unauthorized");
  }

  const token = authHeader.slice("bearer ".length).trim();
  if (!token) {
    throw new Error("Unauthorized");
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return { uid: decodedToken.uid, decodedToken };
  } catch {
    throw new Error("Unauthorized");
  }
}
