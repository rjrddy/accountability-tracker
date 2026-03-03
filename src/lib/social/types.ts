export type UserProfile = {
  uid: string;
  username: string;
  displayName?: string;
  photoURL?: string;
};

export type FriendEdge = {
  uid: string;
  status: "pending_in" | "pending_out" | "accepted";
  createdAt: number;
};
