import { describe, it, expect, vi } from "vitest";
import {
  reviewReferral,
  type ReviewReferralInput,
  type ReviewDb,
  type ReviewServiceDeps,
} from "@/domain/referrals/service";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type FakeReferral = {
  id: string;
  status: string;
  attributionStatus: string;
  partnerId: string;
  adminNotes?: string | null;
  reviewedById?: string | null;
  reviewedAt?: Date | null;
};

function makeReferral(overrides?: Partial<FakeReferral>): FakeReferral {
  return {
    id: "ref_1",
    status: "PENDING_REVIEW",
    attributionStatus: "FIRST_ATTRIBUTED",
    partnerId: "partner_1",
    ...overrides,
  };
}

function makeDb(referral: FakeReferral): ReviewDb {
  const store = { ...referral };
  return {
    referral: {
      findUnique: vi.fn(async () => ({ ...store })),
      update: vi.fn(async ({ data }: { data: Partial<FakeReferral> }) => {
        Object.assign(store, data);
        return { ...store };
      }),
    },
    auditLog: {
      create: vi.fn(async () => ({})),
    },
  } as unknown as ReviewDb;
}

function makeDeps(referral: FakeReferral): ReviewServiceDeps {
  return {
    db: makeDb(referral),
    actor: { id: "admin_1", type: "USER" as const },
  };
}

// ---------------------------------------------------------------------------
// Approve transition
// ---------------------------------------------------------------------------

describe("reviewReferral — APPROVE", () => {
  it("transitions a PENDING_REVIEW FIRST_ATTRIBUTED referral to APPROVED", async () => {
    const deps = makeDeps(makeReferral());
    const input: ReviewReferralInput = {
      referralId: "ref_1",
      action: "APPROVE",
      reviewedById: "admin_1",
    };

    const result = await reviewReferral(input, deps);
    expect(result.status).toBe("APPROVED");
  });

  it("writes an audit log entry with REFERRAL_APPROVED action", async () => {
    const deps = makeDeps(makeReferral());
    await reviewReferral(
      { referralId: "ref_1", action: "APPROVE", reviewedById: "admin_1" },
      deps
    );

    expect(deps.db.auditLog.create).toHaveBeenCalledOnce();
    const call = vi.mocked(deps.db.auditLog.create).mock.calls[0][0];
    expect(call.data.action).toBe("REFERRAL_APPROVED");
  });

  it("stores adminNotes on the referral record", async () => {
    const deps = makeDeps(makeReferral());
    const result = await reviewReferral({
      referralId: "ref_1",
      action: "APPROVE",
      adminNotes: "Looks good",
      reviewedById: "admin_1",
    }, deps);

    expect(result.adminNotes).toBe("Looks good");
  });

  it("blocks approval if attributionStatus is DUPLICATE_NO_CREDIT", async () => {
    const deps = makeDeps(
      makeReferral({ attributionStatus: "DUPLICATE_NO_CREDIT" })
    );

    await expect(
      reviewReferral(
        { referralId: "ref_1", action: "APPROVE", reviewedById: "admin_1" },
        deps
      )
    ).rejects.toThrow(/DUPLICATE_NO_CREDIT/i);
  });

  it("does not write an audit log when approval of DUPLICATE_NO_CREDIT is blocked", async () => {
    const deps = makeDeps(
      makeReferral({ attributionStatus: "DUPLICATE_NO_CREDIT" })
    );

    await expect(
      reviewReferral(
        { referralId: "ref_1", action: "APPROVE", reviewedById: "admin_1" },
        deps
      )
    ).rejects.toThrow();

    expect(deps.db.auditLog.create).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Reject transition
// ---------------------------------------------------------------------------

describe("reviewReferral — REJECT", () => {
  it("transitions a PENDING_REVIEW referral to REJECTED", async () => {
    const deps = makeDeps(makeReferral());
    const result = await reviewReferral(
      { referralId: "ref_1", action: "REJECT", reviewedById: "admin_1" },
      deps
    );

    expect(result.status).toBe("REJECTED");
  });

  it("writes an audit log entry with REFERRAL_REJECTED action", async () => {
    const deps = makeDeps(makeReferral());
    await reviewReferral(
      { referralId: "ref_1", action: "REJECT", reviewedById: "admin_1" },
      deps
    );

    const call = vi.mocked(deps.db.auditLog.create).mock.calls[0][0];
    expect(call.data.action).toBe("REFERRAL_REJECTED");
  });

  it("can reject a DUPLICATE_NO_CREDIT referral (not subject to attribution block)", async () => {
    const deps = makeDeps(
      makeReferral({ attributionStatus: "DUPLICATE_NO_CREDIT" })
    );

    const result = await reviewReferral(
      { referralId: "ref_1", action: "REJECT", reviewedById: "admin_1" },
      deps
    );

    expect(result.status).toBe("REJECTED");
  });
});

// ---------------------------------------------------------------------------
// Guard conditions
// ---------------------------------------------------------------------------

describe("reviewReferral — guards", () => {
  it("throws if referral is not found", async () => {
    const deps = makeDeps(makeReferral());
    vi.mocked(deps.db.referral.findUnique).mockResolvedValueOnce(null);

    await expect(
      reviewReferral(
        { referralId: "nonexistent", action: "APPROVE", reviewedById: "admin_1" },
        deps
      )
    ).rejects.toThrow(/not found/i);
  });

  it("throws when attempting to review an already APPROVED referral", async () => {
    const deps = makeDeps(makeReferral({ status: "APPROVED" }));

    await expect(
      reviewReferral(
        { referralId: "ref_1", action: "REJECT", reviewedById: "admin_1" },
        deps
      )
    ).rejects.toThrow(/APPROVED/);
  });

  it("throws when attempting to review an already REJECTED referral", async () => {
    const deps = makeDeps(makeReferral({ status: "REJECTED" }));

    await expect(
      reviewReferral(
        { referralId: "ref_1", action: "APPROVE", reviewedById: "admin_1" },
        deps
      )
    ).rejects.toThrow(/REJECTED/);
  });

  it("includes the before/after status snapshot in the audit log", async () => {
    const deps = makeDeps(makeReferral());
    await reviewReferral(
      { referralId: "ref_1", action: "REJECT", adminNotes: "spam", reviewedById: "admin_1" },
      deps
    );

    const call = vi.mocked(deps.db.auditLog.create).mock.calls[0][0];
    expect(call.data.before).toEqual({ status: "PENDING_REVIEW" });
    expect(call.data.after).toMatchObject({ status: "REJECTED" });
  });
});
