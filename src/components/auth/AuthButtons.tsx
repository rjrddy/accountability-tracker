"use client";

type AuthButtonsProps = {
  userLabel: string | null;
  loading: boolean;
  isConfigured: boolean;
  onSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
};

export default function AuthButtons({
  userLabel,
  loading,
  isConfigured,
  onSignIn,
  onSignOut
}: AuthButtonsProps) {
  if (!isConfigured) {
    return <p className="text-xs text-slate-500">Firebase auth is not configured.</p>;
  }

  if (loading) {
    return <p className="text-xs text-slate-500">Checking session...</p>;
  }

  return (
    <div className="flex items-center gap-2">
      {userLabel ? (
        <>
          <span className="max-w-48 truncate text-xs text-slate-600">{userLabel}</span>
          <button
            type="button"
            onClick={() => {
              void onSignOut().catch((error: unknown) => {
                console.error("Sign out failed", error);
              });
            }}
            className="inline-flex h-9 items-center rounded-md border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
          >
            Sign out
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => {
            void onSignIn().catch((error: unknown) => {
              console.error("Sign in failed", error);
            });
          }}
          className="inline-flex h-9 items-center rounded-md bg-slate-900 px-3 text-xs font-medium text-white transition hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-600 focus-visible:ring-offset-2"
        >
          Sign in with Google
        </button>
      )}
    </div>
  );
}
