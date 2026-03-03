import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MockSocialAdapter } from "@/lib/social/mockSocialAdapter";

class MemoryStorage implements Storage {
  private data = new Map<string, string>();

  get length(): number {
    return this.data.size;
  }

  clear(): void {
    this.data.clear();
  }

  getItem(key: string): string | null {
    return this.data.has(key) ? this.data.get(key) ?? null : null;
  }

  key(index: number): string | null {
    const keys = [...this.data.keys()];
    return keys[index] ?? null;
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

describe("MockSocialAdapter", () => {
  const storage = new MemoryStorage();

  const profile = (uid: string, username = uid) => ({ uid, username, displayName: uid });

  beforeEach(() => {
    storage.clear();
    vi.stubGlobal("window", {
      localStorage: storage
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("enforces username uniqueness", async () => {
    const userOne = new MockSocialAdapter(profile("user_one"));
    const userTwo = new MockSocialAdapter(profile("user_two"));

    await userOne.setMyUsername("casey");
    await expect(userTwo.setMyUsername("casey")).rejects.toThrow("already taken");
  });

  it("supports request transitions from pending to accepted and cancellation", async () => {
    const userA = new MockSocialAdapter(profile("user_a"));
    const userB = new MockSocialAdapter(profile("user_b"));
    const userC = new MockSocialAdapter(profile("user_c"));

    await userA.sendFriendRequest("user_b");
    const aAfterSend = await userA.listFriendEdges();
    const bAfterSend = await userB.listFriendEdges();
    expect(aAfterSend.find((edge) => edge.uid === "user_b")?.status).toBe("pending_out");
    expect(bAfterSend.find((edge) => edge.uid === "user_a")?.status).toBe("pending_in");

    await userB.acceptFriendRequest("user_a");
    const aAfterAccept = await userA.listFriendEdges();
    const bAfterAccept = await userB.listFriendEdges();
    expect(aAfterAccept.find((edge) => edge.uid === "user_b")?.status).toBe("accepted");
    expect(bAfterAccept.find((edge) => edge.uid === "user_a")?.status).toBe("accepted");

    await userC.sendFriendRequest("user_b");
    const cAfterPending = await userC.listFriendEdges();
    expect(cAfterPending.find((edge) => edge.uid === "user_b")?.status).toBe("pending_out");

    await userC.cancelFriendRequest("user_b");
    const cAfterCancel = await userC.listFriendEdges();
    expect(cAfterCancel.find((edge) => edge.uid === "user_b")?.status).toBeUndefined();
  });

  it("starts with empty social state and no seeded data", async () => {
    const user = new MockSocialAdapter(profile("solo"));
    expect(await user.listFriendEdges()).toEqual([]);
    expect(await user.searchUserByUsername("alex")).toBeNull();
  });
});
