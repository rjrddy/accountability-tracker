import "server-only";

import { App, cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { Auth, getAuth } from "firebase-admin/auth";

const FIREBASE_ADMIN_KEYS = [
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY"
] as const;

export class FirebaseAdminConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FirebaseAdminConfigError";
  }
}

let didLogConfigError = false;

function getFirebaseAdminServiceAccount() {
  const env = {
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY
  };

  const missing = FIREBASE_ADMIN_KEYS.filter((key) => !env[key]);
  if (missing.length > 0) {
    const message = `Missing Firebase Admin env vars: ${missing.join(", ")}`;
    if (!didLogConfigError) {
      console.error(message);
      didLogConfigError = true;
    }
    throw new FirebaseAdminConfigError(message);
  }

  return {
    projectId: env.FIREBASE_PROJECT_ID as string,
    clientEmail: env.FIREBASE_CLIENT_EMAIL as string,
    privateKey: (env.FIREBASE_PRIVATE_KEY as string).replace(/\\n/g, "\n")
  };
}

export function getFirebaseAdminApp(): App {
  const existing = getApps();
  if (existing.length > 0) {
    return getApp();
  }

  return initializeApp({ credential: cert(getFirebaseAdminServiceAccount()) });
}

export function getFirebaseAdminAuth(): Auth {
  return getAuth(getFirebaseAdminApp());
}
