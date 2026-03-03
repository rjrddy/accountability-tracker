"use client";

import type { FriendEdge, UserProfile } from "@/lib/social/types";

type RequestsListProps = {
  requests: FriendEdge[];
  profilesByUid: Record<string, UserProfile>;
  onAccept: (uid: string) => void;
  onDecline: (uid: string) => void;
  onCancel: (uid: string) => void;
};

export default function RequestsList({
  requests,
  profilesByUid,
  onAccept,
  onDecline,
  onCancel
}: RequestsListProps) {
  if (requests.length === 0) {
    return <p className="text-sm text-slate-500">No pending requests.</p>;
  }

  return (
    <ul className="mt-2 space-y-2">
      {requests.map((edge) => {
        const profile = profilesByUid[edge.uid];
        const username = profile?.username ?? edge.uid;
        return (
          <li key={`${edge.uid}-${edge.status}`} className="rounded-md border border-slate-200 bg-white p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-slate-800">@{username}</p>
                <p className="text-xs text-slate-500">
                  {edge.status === "pending_in" ? "Incoming request" : "Outgoing request"}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {edge.status === "pending_in" ? (
                  <>
                    <button
                      type="button"
                      onClick={() => onAccept(edge.uid)}
                      className="inline-flex h-8 items-center rounded-md bg-sky-600 px-2 text-xs font-medium text-white hover:bg-sky-700"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => onDecline(edge.uid)}
                      className="inline-flex h-8 items-center rounded-md border border-slate-300 px-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
                    >
                      Decline
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => onCancel(edge.uid)}
                    className="inline-flex h-8 items-center rounded-md border border-slate-300 px-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
