"use client";

import type { UserProfile } from "@/lib/social/types";

type FriendListProps = {
  friends: UserProfile[];
  selectedUid: string | null;
  onSelect: (uid: string) => void;
};

export default function FriendList({ friends, selectedUid, onSelect }: FriendListProps) {
  if (friends.length === 0) {
    return <p className="text-sm text-slate-500">No friends yet.</p>;
  }

  return (
    <ul className="mt-2 space-y-2">
      {friends.map((friend) => {
        const selected = friend.uid === selectedUid;
        return (
          <li key={friend.uid}>
            <button
              type="button"
              onClick={() => onSelect(friend.uid)}
              className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition ${
                selected
                  ? "border-sky-300 bg-sky-50 text-sky-900"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span>@{friend.username}</span>
              <span className="text-xs text-slate-500">{friend.displayName ?? "Friend"}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
