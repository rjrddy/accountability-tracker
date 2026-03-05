import type { NextRequest } from "next/server";
import type { DecodedIdToken } from "firebase-admin/auth";
import { FirebaseAdminConfigError, getFirebaseAdminAuth } from "@/lib/server/firebaseAdmin";

export async function requireUid(request: NextRequest): Promise<{
  uid: string;
  decodedToken: DecodedIdToken;
}> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
    throw new Error("Missing bearer token");
  }

  const token = authHeader.slice("bearer ".length).trim();
  if (!token) {
    throw new Error("Missing bearer token");
  }

  try {
    const adminAuth = getFirebaseAdminAuth();
    const decodedToken = await adminAuth.verifyIdToken(token);
    return { uid: decodedToken.uid, decodedToken };
  } catch (error: unknown) {
    if (error instanceof FirebaseAdminConfigError) {
      console.error("Firebase Admin is not configured for token verification.", {
        reason: error.message
      });
      throw new Error("Server auth not configured");
    }

    console.error("Token verification failed", {
      reason: error instanceof Error ? error.message : "Unknown auth error"
    });
    throw new Error("Invalid token");
  }
}
