import { describe, it, expect, vi } from "vitest";
import {
  markInReview,
  rejectApplication,
  approvePendingAgreement,
} from "@/domain/applications/service";
import type { SessionUser } from "@/lib/access-control";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const adminActor: SessionUser = { id: "admin_1", role: "ADMIN", status: "ACTIVE" };
const partnerActor: SessionUser = {
  id: "partner_1",
  role: "PARTNER",
  status: "ACTIVE",
  partnerId: "partner_org_1",
};

function makeApp(overrides?: Partial<{ id: string; status: string; email: string; fullName: string }>) {
  return {
    id: "app_1",
    status: "SUBMITTED",
    email: "applicant@example.com",
    fullName: "Test Applicant",
    ...overrides,
  };
}

function makeFakeDb(app: ReturnType<typeof makeApp> | null = makeApp()) {
  return {
    partnerApplication: {
      findFirst: vi.fn().mockResolvedValue(null),
      findUnique: vi.fn().mockResolvedValue(app),
      create: vi.fn(),
      update: vi.fn().mockImplementation(
        ({ data }: { data: Record<string, unknown> }) =>
          Promise.resolve({ ...app!, ...data })
      ),
    },
    auditLog: {
      create: vi.fn().mockResolvedValue({}),
    },
  };
}

// ---------------------------------------------------------------------------
// markInReview
// ---------------------------------------------------------------------------

describe("markInReview", () => {
  it("transitions SUBMITTED -> IN_REVIEW", async () => {
    const db = makeFakeDb(makeApp({ status: "SUBMITTED" }));
    const result = await markInReview("app_1", adminActor, db);

    expect(db.partnerApplication.update).toHaveBeenCalledOnce();
    const call = vi.mocked(db.partnerApplication.update).mock.calls[0][0];
    expect(call.data.status).toBe("IN_REVIEW");
    expect(result.status).toBe("IN_REVIEW");
  });

  it("writes an audit log with before/after status", async () => {
    const db = makeFakeDb(makeApp({ status: "SUBMITTED" }));
    await markInReview("app_1", adminActor, db);

    expect(db.auditLog.create).toHaveBeenCalledOnce();
    const call = vi.mocked(db.auditLog.create).mock.calls[0][0];
    expect(call.data.action).toBe("APPLICATION_MARKED_IN_REVIEW");
    expect(call.data.before).toEqual({ status: "SUBMITTED" });
    expect(call.data.after).toEqual({ status: "IN_REVIEW" });
    expect(call.data.actorId).toBe(adminActor.id);
  });

  it("rejects non-SUBMITTED applications", async () => {
    const db = makeFakeDb(makeApp({ status: "IN_REVIEW" }));
    await expect(markInReview("app_1", adminActor, db)).rejects.toThrow(
      /Cannot mark in review/
    );
    expect(db.partnerApplication.update).not.toHaveBeenCalled();
  });

  it("throws when application is not found", async () => {
    const db = makeFakeDb(null);
    await expect(markInReview("missing_id", adminActor, db)).rejects.toThrow(
      "Application not found"
    );
  });

  it("throws when actor is not admin", async () => {
    const db = makeFakeDb();
    await expect(markInReview("app_1", partnerActor, db)).rejects.toThrow(
      /admin access required/
    );
    expect(db.partnerApplication.update).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// rejectApplication
// ---------------------------------------------------------------------------

describe("rejectApplication", () => {
  it("transitions SUBMITTED -> REJECTED with notes", async () => {
    const db = makeFakeDb(makeApp({ status: "SUBMITTED" }));
    const result = await rejectApplication("app_1", "Not a fit", adminActor, db);

    const call = vi.mocked(db.partnerApplication.update).mock.calls[0][0];
    expect(call.data.status).toBe("REJECTED");
    expect(call.data.reviewNotes).toBe("Not a fit");
    expect(result.status).toBe("REJECTED");
  });

  it("transitions IN_REVIEW -> REJECTED", async () => {
    const db = makeFakeDb(makeApp({ status: "IN_REVIEW" }));
    await rejectApplication("app_1", "Incomplete info", adminActor, db);

    const call = vi.mocked(db.partnerApplication.update).mock.calls[0][0];
    expect(call.data.status).toBe("REJECTED");
  });

  it("writes an audit log with reason", async () => {
    const db = makeFakeDb(makeApp({ status: "SUBMITTED" }));
    await rejectApplication("app_1", "Not a fit", adminActor, db);

    const call = vi.mocked(db.auditLog.create).mock.calls[0][0];
    expect(call.data.action).toBe("APPLICATION_REJECTED");
    expect(call.data.reason).toBe("Not a fit");
    expect(call.data.before).toEqual({ status: "SUBMITTED" });
    expect(call.data.after).toEqual({ status: "REJECTED" });
  });

  it("refuses to reject an already-approved application", async () => {
    const db = makeFakeDb(makeApp({ status: "APPROVED_PENDING_AGREEMENT" }));
    await expect(
      rejectApplication("app_1", "Changed mind", adminActor, db)
    ).rejects.toThrow(/Cannot reject application in status/);
  });

  it("throws when actor is not admin", async () => {
    const db = makeFakeDb();
    await expect(
      rejectApplication("app_1", "reason", partnerActor, db)
    ).rejects.toThrow(/admin access required/);
  });
});

// ---------------------------------------------------------------------------
// approvePendingAgreement
// ---------------------------------------------------------------------------

describe("approvePendingAgreement", () => {
  it("transitions SUBMITTED -> APPROVED_PENDING_AGREEMENT", async () => {
    const db = makeFakeDb(makeApp({ status: "SUBMITTED" }));
    const result = await approvePendingAgreement("app_1", undefined, adminActor, db);

    const call = vi.mocked(db.partnerApplication.update).mock.calls[0][0];
    expect(call.data.status).toBe("APPROVED_PENDING_AGREEMENT");
    expect(result.status).toBe("APPROVED_PENDING_AGREEMENT");
  });

  it("transitions IN_REVIEW -> APPROVED_PENDING_AGREEMENT", async () => {
    const db = makeFakeDb(makeApp({ status: "IN_REVIEW" }));
    await approvePendingAgreement("app_1", "Looks great", adminActor, db);

    const call = vi.mocked(db.partnerApplication.update).mock.calls[0][0];
    expect(call.data.status).toBe("APPROVED_PENDING_AGREEMENT");
    expect(call.data.reviewNotes).toBe("Looks great");
  });

  it("writes an audit log on approval", async () => {
    const db = makeFakeDb(makeApp({ status: "SUBMITTED" }));
    await approvePendingAgreement("app_1", undefined, adminActor, db);

    const call = vi.mocked(db.auditLog.create).mock.calls[0][0];
    expect(call.data.action).toBe("APPLICATION_APPROVED_PENDING_AGREEMENT");
    expect(call.data.before).toEqual({ status: "SUBMITTED" });
    expect(call.data.after).toEqual({ status: "APPROVED_PENDING_AGREEMENT" });
    expect(call.data.actorId).toBe(adminActor.id);
  });

  it("refuses to approve an already-approved application", async () => {
    const db = makeFakeDb(makeApp({ status: "APPROVED_PENDING_AGREEMENT" }));
    await expect(
      approvePendingAgreement("app_1", undefined, adminActor, db)
    ).rejects.toThrow(/Cannot approve application in status/);
  });

  it("refuses to approve a rejected application", async () => {
    const db = makeFakeDb(makeApp({ status: "REJECTED" }));
    await expect(
      approvePendingAgreement("app_1", undefined, adminActor, db)
    ).rejects.toThrow(/Cannot approve application in status/);
  });

  it("throws when actor is not admin", async () => {
    const db = makeFakeDb();
    await expect(
      approvePendingAgreement("app_1", undefined, partnerActor, db)
    ).rejects.toThrow(/admin access required/);
  });

  it("throws when application is not found", async () => {
    const db = makeFakeDb(null);
    await expect(
      approvePendingAgreement("missing_id", undefined, adminActor, db)
    ).rejects.toThrow("Application not found");
  });
});
