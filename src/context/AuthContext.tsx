"use client";

import {
  GoogleAuthProvider,
  User,
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut
} from "firebase/auth";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getFirebaseAuth } from "@/lib/firebaseClient";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  isConfigured: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function isMobileDevice(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return /Android|iPhone|iPad|iPod|Mobile/i.test(window.navigator.userAgent);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const auth = getFirebaseAuth();
  const isConfigured = Boolean(auth);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    getRedirectResult(auth).catch((error: unknown) => {
      console.error("Failed to complete auth redirect", error);
    });

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isConfigured,
      async signIn() {
        if (!auth) {
          return;
        }

        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });

        if (isMobileDevice()) {
          await signInWithRedirect(auth, provider);
          return;
        }

        await signInWithPopup(auth, provider);
      },
      async signOut() {
        if (!auth) {
          return;
        }
        await firebaseSignOut(auth);
      }
    }),
    [auth, isConfigured, loading, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
