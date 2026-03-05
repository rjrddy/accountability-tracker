import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const env = {
    FIREBASE_PROJECT_ID: Boolean(process.env.FIREBASE_PROJECT_ID),
    FIREBASE_CLIENT_EMAIL: Boolean(process.env.FIREBASE_CLIENT_EMAIL),
    FIREBASE_PRIVATE_KEY: Boolean(process.env.FIREBASE_PRIVATE_KEY)
  };

  return NextResponse.json({
    ok: Object.values(env).every(Boolean),
    env
  });
}
