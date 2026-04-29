import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  buildAuditPayload,
  writeAuditLog,
  createAuditWriter,
  type Actor,
  type AuditClient,
  type AuditPayload,
} from "@/lib/audit";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeClient(
  impl: () => Promise<unknown> = () => Promise.resolve()
): AuditClient {
  return {
    auditLog: {
      create: vi.fn(impl),
    },
  };
}

const userActor: Actor = { id: "user_abc123", type: "USER" };
const systemActor: Actor = { type: "SYSTEM" };

// ---------------------------------------------------------------------------
// buildAuditPayload
// ---------------------------------------------------------------------------

describe("buildAuditPayload", () => {
  it("sets actorId and actorType USER for a USER actor", () => {
    const payload = buildAuditPayload(userActor, "PARTNER_APPROVED", "Partner", "partner_1");

    expect(payload.actorId).toBe("user_abc123");
    expect(payload.actorType).toBe("USER");
  });

  it("sets actorType SYSTEM and omits actorId for a SYSTEM actor", () => {
    const payload = buildAuditPayload(systemActor, "COMMISSION_STAGED", "CommissionEvent", "evt_1");

    expect(payload.actorType).toBe("SYSTEM");
    expect(payload.actorId).toBeUndefined();
    expect("actorId" in payload).toBe(false);
  });

  it("includes before, after, and reason when provided", () => {
    const before = { status: "INVITED" };
    const after = { status: "ACTIVE" };
    const reason = "Manually activated by admin";

    const payload = buildAuditPayload(
      userActor,
      "PARTNER_ACTIVATED",
      "Partner",
      "partner_2",
      { before, after, reason }
    );

    expect(payload.before).toEqual(before);
    expect(payload.after).toEqual(after);
    expect(payload.reason).toBe(reason);
  });

  it("omits before, after, and reason when opts is not provided", () => {
    const payload = buildAuditPayload(userActor, "PARTNER_VIEWED", "Partner", "partner_3");

    expect("before" in payload).toBe(false);
    expect("after" in payload).toBe(false);
    expect("reason" in payload).toBe(false);
  });

  it("maps action, entityType, entityId onto the payload", () => {
    const payload = buildAuditPayload(userActor, "REFERRAL_REJECTED", "Referral", "ref_99");

    expect(payload.action).toBe("REFERRAL_REJECTED");
    expect(payload.entityType).toBe("Referral");
    expect(payload.entityId).toBe("ref_99");
  });
});

// ---------------------------------------------------------------------------
// writeAuditLog
// ---------------------------------------------------------------------------

describe("writeAuditLog", () => {
  let client: AuditClient;

  beforeEach(() => {
    client = makeClient();
  });

  it("calls client.auditLog.create with the supplied payload", async () => {
    const payload: AuditPayload = {
      actorId: "user_abc123",
      actorType: "USER",
      action: "PARTNER_APPROVED",
      entityType: "Partner",
      entityId: "partner_1",
    };

    await writeAuditLog(client, payload);

    expect(client.auditLog.create).toHaveBeenCalledOnce();
    expect(client.auditLog.create).toHaveBeenCalledWith({ data: payload });
  });

  it("does not throw when client.auditLog.create rejects", async () => {
    const faultyClient = makeClient(() => Promise.reject(new Error("DB offline")));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const payload: AuditPayload = {
      actorType: "SYSTEM",
      action: "COMMISSION_STAGED",
      entityType: "CommissionEvent",
      entityId: "evt_1",
    };

    await expect(writeAuditLog(faultyClient, payload)).resolves.toBeUndefined();

    consoleSpy.mockRestore();
  });

  it("logs the error to console.error when the client throws", async () => {
    const error = new Error("DB offline");
    const faultyClient = makeClient(() => Promise.reject(error));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const payload: AuditPayload = {
      actorType: "SYSTEM",
      action: "COMMISSION_STAGED",
      entityType: "CommissionEvent",
      entityId: "evt_2",
    };

    await writeAuditLog(faultyClient, payload);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("[audit]"),
      error
    );

    consoleSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// createAuditWriter
// ---------------------------------------------------------------------------

describe("createAuditWriter", () => {
  it("returns a function that builds a payload and writes it correctly", async () => {
    const client = makeClient();
    const audit = createAuditWriter(client);

    await audit(userActor, "PARTNER_APPROVED", "Partner", "partner_42", {
      before: { status: "IN_REVIEW" },
      after: { status: "ACTIVE" },
      reason: "Approved by admin",
    });

    expect(client.auditLog.create).toHaveBeenCalledOnce();

    const call = vi.mocked(client.auditLog.create).mock.calls[0][0];
    expect(call.data).toMatchObject({
      actorId: "user_abc123",
      actorType: "USER",
      action: "PARTNER_APPROVED",
      entityType: "Partner",
      entityId: "partner_42",
      before: { status: "IN_REVIEW" },
      after: { status: "ACTIVE" },
      reason: "Approved by admin",
    });
  });

  it("works correctly with a SYSTEM actor (no actorId)", async () => {
    const client = makeClient();
    const audit = createAuditWriter(client);

    await audit(systemActor, "COMMISSION_STAGED", "CommissionEvent", "evt_99");

    const call = vi.mocked(client.auditLog.create).mock.calls[0][0];
    expect(call.data.actorType).toBe("SYSTEM");
    expect(call.data.actorId).toBeUndefined();
  });

  it("swallows errors from the underlying client (does not throw)", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const faultyClient = makeClient(() => Promise.reject(new Error("network error")));
    const audit = createAuditWriter(faultyClient);

    await expect(
      audit(systemActor, "SOME_ACTION", "SomeEntity", "id_1")
    ).resolves.toBeUndefined();

    consoleSpy.mockRestore();
  });
});
