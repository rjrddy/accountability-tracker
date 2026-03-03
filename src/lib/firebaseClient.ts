"use client";

import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { Auth, GoogleAuthProvider, getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const REQUIRED_KEYS = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"
] as const;

function findMissingKeys(): string[] {
  const byKey: Record<(typeof REQUIRED_KEYS)[number], string | undefined> = {
    NEXT_PUBLIC_FIREBASE_API_KEY: firebaseConfig.apiKey,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: firebaseConfig.authDomain,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: firebaseConfig.projectId,
    NEXT_PUBLIC_FIREBASE_APP_ID: firebaseConfig.appId,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: firebaseConfig.storageBucket,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: firebaseConfig.messagingSenderId
  };

  return REQUIRED_KEYS.filter((key) => !byKey[key]);
}

function getFirebaseConfigOrThrow() {
  const missingKeys = findMissingKeys();
  if (missingKeys.length > 0) {
    const message = `Missing Firebase env vars: ${missingKeys.join(", ")}`;
    if (process.env.NODE_ENV === "development") {
      console.error(message);
    }
    throw new Error(message);
  }

  return firebaseConfig;
}

let firebaseInitError: string | null = null;
let firebaseApp: FirebaseApp | null = null;

if (typeof window !== "undefined") {
  try {
    const cfg = getFirebaseConfigOrThrow();
    firebaseApp = getApps().length > 0 ? getApp() : initializeApp(cfg);
  } catch (error: unknown) {
    firebaseInitError = error instanceof Error ? error.message : "Firebase initialization failed";
  }
}

export { firebaseApp };
export const auth: Auth | null = firebaseApp ? getAuth(firebaseApp) : null;
export const googleProvider: GoogleAuthProvider | null = auth
  ? new GoogleAuthProvider()
  : null;
export { firebaseInitError };
