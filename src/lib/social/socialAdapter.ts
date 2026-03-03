import type { GoalsByDate } from "@/lib/goalsStore";
import type { FriendEdge, UserProfile } from "@/lib/social/types";

export interface SocialAdapter {
  getMyProfile(): Promise<UserProfile | null>;
  setMyUsername(username: string): Promise<void>;
  searchUserByUsername(username: string): Promise<UserProfile | null>;
  sendFriendRequest(toUid: string): Promise<void>;
  acceptFriendRequest(fromUid: string): Promise<void>;
  declineFriendRequest(fromUid: string): Promise<void>;
  cancelFriendRequest(toUid: string): Promise<void>;
  listFriendEdges(): Promise<FriendEdge[]>;
  getProfileByUid(uid: string): Promise<UserProfile | null>;
  getGoalsByUid(uid: string): Promise<GoalsByDate>;
}
