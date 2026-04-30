import { describe, expect, it } from "vitest";

import { createSessionToken, verifySessionToken } from "@/lib/session";

const secret = "test-secret-with-at-least-thirty-two-characters";

describe("session tokens", () => {
  it("round-trips a signed admin session", async () => {
    const token = await createSessionToken(
      { id: "user_1", role: "ADMIN", status: "ACTIVE" },
      secret
    );

    await expect(verifySessionToken(token, secret)).resolves.toEqual({
      id: "user_1",
      role: "ADMIN",
      status: "ACTIVE",
      partnerId: undefined,
    });
  });

  it("round-trips partner id when present", async () => {
    const token = await createSessionToken(
      { id: "user_2", role: "PARTNER", status: "ACTIVE", partnerId: "partner_1" },
      secret
    );

    await expect(verifySessionToken(token, secret)).resolves.toMatchObject({
      id: "user_2",
      partnerId: "partner_1",
    });
  });

  it("rejects tokens signed with another secret", async () => {
    const token = await createSessionToken(
      { id: "user_1", role: "ADMIN", status: "ACTIVE" },
      secret
    );

    await expect(verifySessionToken(token, "different-secret-with-at-least-thirty-two-chars")).resolves.toBeNull();
  });

  it("rejects expired tokens", async () => {
    const token = await createSessionToken(
      { id: "user_1", role: "ADMIN", status: "ACTIVE" },
      secret,
      -1
    );

    await expect(verifySessionToken(token, secret)).resolves.toBeNull();
  });

  it("rejects malformed tokens without throwing", async () => {
    await expect(verifySessionToken("not-a-token", secret)).resolves.toBeNull();
    await expect(verifySessionToken("abc.!", secret)).resolves.toBeNull();
  });
});
