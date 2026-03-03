"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import FriendComparison from "@/components/friends/FriendComparison";
import FriendList from "@/components/friends/FriendList";
import RequestsList from "@/components/friends/RequestsList";
import type { GoalsByDate } from "@/lib/goalsStore";
import type { SocialAdapter } from "@/lib/social/socialAdapter";
import type { FriendEdge, UserProfile } from "@/lib/social/types";

type FriendsPageProps = {
  adapter: SocialAdapter;
  currentProfile: UserProfile;
  myGoalsByDate: GoalsByDate;
};

export default function FriendsPage({ adapter, currentProfile, myGoalsByDate }: FriendsPageProps) {
  const [searchInput, setSearchInput] = useState("");
  const [edges, setEdges] = useState<FriendEdge[]>([]);
  const [profilesByUid, setProfilesByUid] = useState<Record<string, UserProfile>>({});
  const [selectedFriendUid, setSelectedFriendUid] = useState<string | null>(null);
  const [selectedFriendGoals, setSelectedFriendGoals] = useState<GoalsByDate>({});
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const nextEdges = await adapter.listFriendEdges();
    setEdges(nextEdges);

    const uids = Array.from(new Set(nextEdges.map((edge) => edge.uid)));
    const profilePairs = await Promise.all(
      uids.map(async (uid) => {
        const user = await adapter.getProfileByUid(uid);
        return [uid, user] as const;
      })
    );

    const mapped: Record<string, UserProfile> = {};
    for (const [uid, profileByUid] of profilePairs) {
      if (profileByUid) {
        mapped[uid] = profileByUid;
      }
    }
    setProfilesByUid(mapped);
  }, [adapter]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!selectedFriendUid) {
      return;
    }

    void adapter.getGoalsByUid(selectedFriendUid).then(setSelectedFriendGoals);
  }, [adapter, selectedFriendUid]);

  const requests = edges.filter((edge) => edge.status !== "accepted");
  const friends = useMemo(
    () =>
      edges
        .filter((edge) => edge.status === "accepted")
        .map((edge) => profilesByUid[edge.uid])
        .filter((profile): profile is UserProfile => Boolean(profile)),
    [edges, profilesByUid]
  );

  const selectedFriend = selectedFriendUid ? profilesByUid[selectedFriendUid] ?? null : null;

  return (
    <section className="space-y-4">
      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Your profile</h2>
        <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 p-3">
          <p className="text-sm text-slate-700">@{currentProfile.username}</p>
          <p className="text-xs text-slate-500">
            {currentProfile.displayName ?? (currentProfile.uid === "guest" ? "Guest mode" : currentProfile.uid)}
          </p>
        </div>
      </article>

      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Add friend</h2>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className="h-10 min-w-[220px] flex-1 rounded-md border border-slate-300 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            placeholder="Search by username"
          />
          <button
            type="button"
            onClick={() => {
              void adapter
                .searchUserByUsername(searchInput)
                .then((user) => {
                  if (!user) {
                    throw new Error("User not found");
                  }
                  return adapter.sendFriendRequest(user.uid);
                })
                .then(() => refresh())
                .then(() => setMessage("Friend request sent."))
                .catch((error: unknown) => setMessage((error as Error).message));
            }}
            className="inline-flex h-10 items-center rounded-md bg-sky-600 px-3 text-sm font-medium text-white hover:bg-sky-700"
          >
            Add
          </button>
        </div>
      </article>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Requests</h2>
          <RequestsList
            requests={requests}
            profilesByUid={profilesByUid}
            onAccept={(uid) => {
              void adapter.acceptFriendRequest(uid).then(refresh).catch((error: unknown) => {
                setMessage((error as Error).message);
              });
            }}
            onDecline={(uid) => {
              void adapter.declineFriendRequest(uid).then(refresh).catch((error: unknown) => {
                setMessage((error as Error).message);
              });
            }}
            onCancel={(uid) => {
              void adapter.cancelFriendRequest(uid).then(refresh).catch((error: unknown) => {
                setMessage((error as Error).message);
              });
            }}
          />
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Friends</h2>
          <FriendList
            friends={friends}
            selectedUid={selectedFriendUid}
            onSelect={(uid) => setSelectedFriendUid(uid)}
          />
        </article>
      </div>

      {message ? <p className="text-sm text-slate-600">{message}</p> : null}

      {selectedFriend ? (
        <FriendComparison
          me={currentProfile}
          friend={selectedFriend}
          myGoalsByDate={myGoalsByDate}
          friendGoalsByDate={selectedFriendGoals}
        />
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
          Select a friend to view comparison.
        </div>
      )}
    </section>
  );
}
