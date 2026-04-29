import { describe, it, expect, vi } from "vitest";
import {
  normalizeAttributionKey,
  extractDomain,
} from "@/domain/referrals/normalize";
import {
  submitReferral,
  type ReferralInput,
  type ReferralServiceDeps,
} from "@/domain/referrals/service";

// ---------------------------------------------------------------------------
// normalize.ts tests
// ---------------------------------------------------------------------------

describe("extractDomain", () => {
  it("extracts domain from a standard email", () => {
    expect(extractDomain("lead@example.com")).toBe("example.com");
  });

  it("lowercases the domain", () => {
    expect(extractDomain("User@EXAMPLE.COM")).toBe("example.com");
  });

  it("returns null for a string with no @", () => {
    expect(extractDomain("notanemail")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(extractDomain("")).toBeNull();
  });
});

describe("normalizeAttributionKey", () => {
  it("builds an email: prefixed key from leadEmail, lowercased and trimmed", () => {
    expect(normalizeAttributionKey({ leadEmail: "  Lead@Example.COM  " })).toBe(
      "email:lead@example.com"
    );
  });

  it("falls back to domain: prefixed key from leadCompany domain when email is absent", () => {
    expect(
      normalizeAttributionKey({ leadEmail: undefined, leadDomain: "example.com" })
    ).toBe("domain:example.com");
  });

  it("falls back to domain: key from leadEmail domain when leadDomain is absent but leadEmail is present — not used for key prefix", () => {
    // email is preferred over domain when present
    expect(
      normalizeAttributionKey({ leadEmail: "lead@acme.io", leadDomain: "acme.io" })
    ).toBe("email:lead@acme.io");
  });

  it("lowercases the leadDomain fallback key", () => {
    expect(
      normalizeAttributionKey({ leadEmail: undefined, leadDomain: "ACME.IO" })
    ).toBe("domain:acme.io");
  });

  it("throws when both leadEmail and leadDomain are absent", () => {
    expect(() =>
      normalizeAttributionKey({ leadEmail: undefined, leadDomain: undefined })
    ).toThrow(/attribution key/i);
  });

  it("throws when both leadEmail and leadDomain are empty strings", () => {
    expect(() =>
      normalizeAttributionKey({ leadEmail: "", leadDomain: "" })
    ).toThrow(/attribution key/i);
  });
});

// ---------------------------------------------------------------------------
// service.ts — fake client tests
// ---------------------------------------------------------------------------

type FakeAttributionLock = {
  id: string;
  key: string;
  partnerId: string;
  firstReferralId: string | null;
};

type FakeReferral = {
  id: string;
  partnerId: string;
  attributionKey: string;
  attributionStatus: "FIRST_ATTRIBUTED" | "DUPLICATE_NO_CREDIT";
  status: "PENDING_REVIEW";
  leadName: string;
  leadEmail: string | null;
  leadCompany: string | null;
  leadDomain: string | null;
  country: string | null;
  notes: string | null;
  originalPayload: object;
};

function makeDeps(overrides?: Partial<ReferralServiceDeps>): ReferralServiceDeps {
  const locks: Map<string, FakeAttributionLock> = new Map();
  const referrals: FakeReferral[] = [];

  const defaultDeps: ReferralServiceDeps = {
    db: {
      $transaction: vi.fn(async <T,>(fn: (tx: ReferralServiceDeps["db"]) => Promise<T>) => fn(defaultDeps.db)),
      referral: {
        create: vi.fn(async ({ data }: { data: Omit<FakeReferral, "id"> }) => {
          const r = { id: `ref_${referrals.length + 1}`, ...data };
          referrals.push(r as FakeReferral);
          return r;
        }),
      },
      attributionLock: {
        create: vi.fn(async ({ data }: { data: Omit<FakeAttributionLock, "id"> }) => {
          if (locks.has(data.key)) {
            const err = new Error("Unique constraint failed on AttributionLock.key");
            (err as NodeJS.ErrnoException).code = "P2002";
            throw err;
          }
          const lock = { id: `lock_${locks.size + 1}`, ...data };
          locks.set(data.key, lock);
          return lock;
        }),
        findUnique: vi.fn(async ({ where }: { where: { key: string } }) => {
          return locks.get(where.key) ?? null;
        }),
        update: vi.fn(async ({ where, data }: { where: { key: string }; data: Partial<FakeAttributionLock> }) => {
          const current = locks.get(where.key);
          if (!current) throw new Error(`AttributionLock not found: ${where.key}`);
          const updated = { ...current, ...data };
          locks.set(where.key, updated);
          return updated;
        }),
      },
      auditLog: {
        create: vi.fn(async () => ({})),
      },
    } as unknown as ReferralServiceDeps["db"],
    actor: { id: "admin_1", type: "USER" as const },
  };

  return { ...defaultDeps, ...overrides };
}

const baseInput: ReferralInput = {
  partnerId: "partner_1",
  leadName: "Alice Smith",
  leadEmail: "alice@example.com",
  leadCompany: "Example Co",
  leadDomain: "example.com",
  country: "US",
  notes: null,
};

describe("submitReferral — first attribution", () => {
  it("creates an AttributionLock and returns FIRST_ATTRIBUTED on first submission", async () => {
    const deps = makeDeps();
    const result = await submitReferral(baseInput, deps);

    expect(result.attributionStatus).toBe("FIRST_ATTRIBUTED");
    expect(result.status).toBe("PENDING_REVIEW");
    expect(result.attributionKey).toBe("email:alice@example.com");
    expect(deps.db.attributionLock.create).toHaveBeenCalledOnce();
    expect(deps.db.attributionLock.update).toHaveBeenCalledWith({
      where: { key: "email:alice@example.com" },
      data: { firstReferralId: result.id },
    });
  });

  it("runs lock, referral, and audit writes inside a transaction", async () => {
    const deps = makeDeps();
    await submitReferral(baseInput, deps);
    expect(deps.db.$transaction).toHaveBeenCalledOnce();
  });

  it("writes an audit log entry on first submission", async () => {
    const deps = makeDeps();
    await submitReferral(baseInput, deps);
    expect(deps.db.auditLog.create).toHaveBeenCalledOnce();
  });

  it("uses domain: key when leadEmail is absent", async () => {
    const deps = makeDeps();
    const result = await submitReferral(
      { ...baseInput, leadEmail: undefined, leadDomain: "example.com" },
      deps
    );
    expect(result.attributionKey).toBe("domain:example.com");
    expect(result.attributionStatus).toBe("FIRST_ATTRIBUTED");
  });
});

describe("submitReferral — duplicate no-credit", () => {
  it("returns DUPLICATE_NO_CREDIT on second submission for the same key", async () => {
    const deps = makeDeps();

    const first = await submitReferral(baseInput, deps);
    expect(first.attributionStatus).toBe("FIRST_ATTRIBUTED");

    const second = await submitReferral(
      { ...baseInput, partnerId: "partner_2" },
      deps
    );
    expect(second.attributionStatus).toBe("DUPLICATE_NO_CREDIT");
    expect(second.status).toBe("PENDING_REVIEW");
  });

  it("DUPLICATE_NO_CREDIT referrals still record the correct attributionKey", async () => {
    const deps = makeDeps();
    await submitReferral(baseInput, deps);
    const dup = await submitReferral({ ...baseInput, partnerId: "partner_2" }, deps);
    expect(dup.attributionKey).toBe("email:alice@example.com");
  });

  it("DUPLICATE_NO_CREDIT submissions still write an audit log entry", async () => {
    const deps = makeDeps();
    await submitReferral(baseInput, deps);
    await submitReferral({ ...baseInput, partnerId: "partner_2" }, deps);
    expect(deps.db.auditLog.create).toHaveBeenCalledTimes(2);
  });
});

describe("submitReferral — validation", () => {
  it("rejects when both leadEmail and leadDomain are absent", async () => {
    const deps = makeDeps();
    await expect(
      submitReferral({ ...baseInput, leadEmail: undefined, leadDomain: undefined }, deps)
    ).rejects.toThrow(/attribution key/i);
  });

  it("rejects when partnerId is missing", async () => {
    const deps = makeDeps();
    await expect(
      submitReferral({ ...baseInput, partnerId: "" }, deps)
    ).rejects.toThrow(/partnerId/i);
  });

  it("rejects when leadName is missing", async () => {
    const deps = makeDeps();
    await expect(
      submitReferral({ ...baseInput, leadName: "" }, deps)
    ).rejects.toThrow(/leadName/i);
  });
});
