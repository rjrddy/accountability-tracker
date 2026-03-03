import type { GoalsByDate } from "@/lib/goalsStore";
import { getStorageKey } from "@/lib/goalsStore";
import type { SocialAdapter } from "@/lib/social/socialAdapter";
import type { FriendEdge, UserProfile } from "@/lib/social/types";

type ConnectionRecord = {
  requesterUid: string;
  status: "pending" | "accepted";
  createdAt: number;
};

type MockSocialDb = {
  usersByUid: Record<string, UserProfile>;
  usernameToUid: Record<string, string>;
  connections: Record<string, ConnectionRecord>;
};

const SOCIAL_DB_KEY = "social:mock:v1";

function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}

function connectionKey(a: string, b: string): string {
  return [a, b].sort().join("|");
}

function parseConnectionKey(key: string): [string, string] {
  const [left, right] = key.split("|");
  return [left, right];
}

function readDb(): MockSocialDb {
  if (typeof window === "undefined") {
    return {
      usersByUid: {},
      usernameToUid: {},
      connections: {}
    };
  }

  const raw = window.localStorage.getItem(SOCIAL_DB_KEY);
  if (!raw) {
    return {
      usersByUid: {},
      usernameToUid: {},
      connections: {}
    };
  }

  try {
    const parsed = JSON.parse(raw) as MockSocialDb;
    return {
      usersByUid: parsed.usersByUid ?? {},
      usernameToUid: parsed.usernameToUid ?? {},
      connections: parsed.connections ?? {}
    };
  } catch {
    return {
      usersByUid: {},
      usernameToUid: {},
      connections: {}
    };
  }
}

function writeDb(db: MockSocialDb): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(SOCIAL_DB_KEY, JSON.stringify(db));
}

function upsertProfile(db: MockSocialDb, profile: UserProfile): void {
  db.usersByUid[profile.uid] = profile;
  db.usernameToUid[normalizeUsername(profile.username)] = profile.uid;
}

function ensureUser(db: MockSocialDb, uid: string): UserProfile {
  const existing = db.usersByUid[uid];
  if (existing) {
    return existing;
  }

  const profile: UserProfile = {
    uid,
    username: uid
  };

  upsertProfile(db, profile);
  return profile;
}

function otherUidFromConnection(key: string, selfUid: string): string | null {
  const [left, right] = parseConnectionKey(key);
  if (left === selfUid) {
    return right;
  }
  if (right === selfUid) {
    return left;
  }
  return null;
}

export class MockSocialAdapter implements SocialAdapter {
  constructor(private readonly currentProfile: UserProfile) {
    const db = readDb();
    upsertProfile(db, this.currentProfile);
    writeDb(db);
  }

  async getMyProfile(): Promise<UserProfile | null> {
    const db = readDb();
    return db.usersByUid[this.currentProfile.uid] ?? this.currentProfile;
  }

  async setMyUsername(username: string): Promise<void> {
    const normalized = normalizeUsername(username);
    if (!normalized) {
      throw new Error("Username cannot be empty");
    }

    const db = readDb();
    const current = ensureUser(db, this.currentProfile.uid);
    const existingUid = db.usernameToUid[normalized];
    if (existingUid && existingUid !== current.uid) {
      throw new Error("Username is already taken");
    }

    delete db.usernameToUid[normalizeUsername(current.username)];
    const updated: UserProfile = {
      ...current,
      username: username.trim()
    };
    upsertProfile(db, updated);
    writeDb(db);
  }

  async searchUserByUsername(username: string): Promise<UserProfile | null> {
    const db = readDb();
    const uid = db.usernameToUid[normalizeUsername(username)];
    if (!uid || uid === this.currentProfile.uid) {
      return null;
    }
    return db.usersByUid[uid] ?? null;
  }

  async sendFriendRequest(toUid: string): Promise<void> {
    if (toUid === this.currentProfile.uid) {
      throw new Error("Cannot add yourself");
    }

    const db = readDb();
    if (!db.usersByUid[toUid]) {
      throw new Error("User not found");
    }

    const key = connectionKey(this.currentProfile.uid, toUid);
    const existing = db.connections[key];

    if (existing?.status === "accepted") {
      throw new Error("Already friends");
    }

    if (existing?.status === "pending") {
      throw new Error("Request already pending");
    }

    db.connections[key] = {
      requesterUid: this.currentProfile.uid,
      status: "pending",
      createdAt: Date.now()
    };
    writeDb(db);
  }

  async acceptFriendRequest(fromUid: string): Promise<void> {
    const db = readDb();
    const key = connectionKey(this.currentProfile.uid, fromUid);
    const existing = db.connections[key];

    if (!existing || existing.status !== "pending" || existing.requesterUid !== fromUid) {
      throw new Error("No incoming request from this user");
    }

    db.connections[key] = {
      ...existing,
      status: "accepted"
    };
    writeDb(db);
  }

  async declineFriendRequest(fromUid: string): Promise<void> {
    const db = readDb();
    const key = connectionKey(this.currentProfile.uid, fromUid);
    const existing = db.connections[key];

    if (!existing || existing.status !== "pending" || existing.requesterUid !== fromUid) {
      throw new Error("No incoming request from this user");
    }

    delete db.connections[key];
    writeDb(db);
  }

  async cancelFriendRequest(toUid: string): Promise<void> {
    const db = readDb();
    const key = connectionKey(this.currentProfile.uid, toUid);
    const existing = db.connections[key];

    if (!existing || existing.status !== "pending" || existing.requesterUid !== this.currentProfile.uid) {
      throw new Error("No outgoing request to this user");
    }

    delete db.connections[key];
    writeDb(db);
  }

  async listFriendEdges(): Promise<FriendEdge[]> {
    const db = readDb();
    const edges: FriendEdge[] = [];

    for (const [key, record] of Object.entries(db.connections)) {
      const otherUid = otherUidFromConnection(key, this.currentProfile.uid);
      if (!otherUid) {
        continue;
      }

      if (record.status === "accepted") {
        edges.push({ uid: otherUid, status: "accepted", createdAt: record.createdAt });
        continue;
      }

      edges.push({
        uid: otherUid,
        status: record.requesterUid === this.currentProfile.uid ? "pending_out" : "pending_in",
        createdAt: record.createdAt
      });
    }

    return edges.sort((a, b) => b.createdAt - a.createdAt);
  }

  async getProfileByUid(uid: string): Promise<UserProfile | null> {
    const db = readDb();
    return db.usersByUid[uid] ?? null;
  }

  async getGoalsByUid(uid: string): Promise<GoalsByDate> {
    if (typeof window === "undefined") {
      return {};
    }

    const raw = window.localStorage.getItem(getStorageKey(uid));
    if (!raw) {
      return {};
    }

    try {
      return JSON.parse(raw) as GoalsByDate;
    } catch {
      return {};
    }
  }
}

export function createMockSocialAdapter(currentProfile: UserProfile): SocialAdapter {
  return new MockSocialAdapter(currentProfile);
}
