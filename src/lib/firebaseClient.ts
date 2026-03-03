"use client";

import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { Auth, getAuth } from "firebase/auth";
import admin from "firebase-admin";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

export const adminAuth = admin.auth();

let cachedApp: FirebaseApp | null = null;
let cachedAuth: Auth | null = null;

function isFirebaseConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.appId
  );
}

export function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === "undefined" || !isFirebaseConfigured()) {
    return null;
  }

  if (cachedApp) {
    return cachedApp;
  }

  cachedApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  return cachedApp;
}

export function getFirebaseAuth(): Auth | null {
  if (typeof window === "undefined") {
    return null;
  }

  if (cachedAuth) {
    return cachedAuth;
  }

  const app = getFirebaseApp();
  if (!app) {
    return null;
  }

  cachedAuth = getAuth(app);
  return cachedAuth;
}
