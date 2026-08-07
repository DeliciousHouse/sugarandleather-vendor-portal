import { describe, it, expect, vi } from "vitest";
import { ApplicationSchema } from "@/domain/applications/schema";
import { submitApplication } from "@/domain/applications/service";
import type { ApplicationInput } from "@/domain/applications/schema";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const validInput: ApplicationInput = {
  fullName: "Jane Smith",
  email: "jane@example.com",
  phone: "+1 555 0100",
  company: "Acme Corp",
  country: "US",
  promotionChannels: ["blog", "youtube"],
  aiTechExperience: "5 years working with ML systems in enterprise environments",
  audience: "CTOs and VP-level leaders at mid-market SaaS companies",
  subjectiveAnswers: {
    whyPartner: "I believe in the mission to humanize AI",
    promotionStrategy: "Through targeted content and speaking engagements",
    audienceFit: "My audience actively evaluates AI tools for their teams",
  },
};

function makeFakeDb(overrides?: {
  findFirst?: ReturnType<typeof vi.fn>;
  create?: ReturnType<typeof vi.fn>;
}): Parameters<typeof submitApplication>[1] {
  return {
    partnerApplication: {
      findFirst:
        overrides?.findFirst ?? vi.fn().mockResolvedValue(null),
      findUnique: vi.fn().mockResolvedValue(null),
      create:
        overrides?.create ??
        vi.fn().mockImplementation(
          ({ data }: { data: Record<string, unknown> }) =>
            Promise.resolve({
              id: "app_test_1",
              status: data.status ?? "SUBMITTED",
              email: data.email ?? "",
              fullName: data.fullName ?? "",
            })
        ),
      update: vi.fn(),
    },
    auditLog: {
      create: vi.fn().mockResolvedValue({}),
    },
  } as unknown as Parameters<typeof submitApplication>[1];
}

// ---------------------------------------------------------------------------
// ApplicationSchema — field validation
// ---------------------------------------------------------------------------

describe("ApplicationSchema", () => {
  it("accepts a valid complete input", () => {
    expect(() => ApplicationSchema.parse(validInput)).not.toThrow();
  });

  it("rejects missing fullName", () => {
    const result = ApplicationSchema.safeParse({ ...validInput, fullName: undefined });
    expect(result.success).toBe(false);
  });

  it("rejects empty fullName", () => {
    const result = ApplicationSchema.safeParse({ ...validInput, fullName: "" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email format", () => {
    const result = ApplicationSchema.safeParse({
      ...validInput,
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing country", () => {
    const result = ApplicationSchema.safeParse({ ...validInput, country: undefined });
    expect(result.success).toBe(false);
  });

  it("rejects empty promotionChannels array", () => {
    const result = ApplicationSchema.safeParse({
      ...validInput,
      promotionChannels: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing aiTechExperience", () => {
    const result = ApplicationSchema.safeParse({ ...validInput, aiTechExperience: undefined });
    expect(result.success).toBe(false);
  });

  it("rejects missing audience", () => {
    const result = ApplicationSchema.safeParse({ ...validInput, audience: undefined });
    expect(result.success).toBe(false);
  });

  it("rejects empty subjectiveAnswers whyPartner", () => {
    const result = ApplicationSchema.safeParse({
      ...validInput,
      subjectiveAnswers: { ...validInput.subjectiveAnswers, whyPartner: "" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing promotionStrategy", () => {
    const result = ApplicationSchema.safeParse({
      ...validInput,
      subjectiveAnswers: {
        whyPartner: validInput.subjectiveAnswers.whyPartner,
        promotionStrategy: "",
        audienceFit: validInput.subjectiveAnswers.audienceFit,
      },
    });
    expect(result.success).toBe(false);
  });

  it("allows optional phone and company to be absent", () => {
    const result = ApplicationSchema.safeParse({
      ...validInput,
      phone: undefined,
      company: undefined,
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// submitApplication
// ---------------------------------------------------------------------------

describe("submitApplication", () => {
  it("creates a new application record", async () => {
    const db = makeFakeDb();
    const result = await submitApplication(validInput, db);

    expect(db.partnerApplication.create).toHaveBeenCalledOnce();
    expect(result.id).toBe("app_test_1");
    expect(result.status).toBe("SUBMITTED");
  });

  it("writes an audit log entry on submission", async () => {
    const db = makeFakeDb();
    await submitApplication(validInput, db);

    expect(db.auditLog.create).toHaveBeenCalledOnce();
    const call = vi.mocked(db.auditLog.create).mock.calls[0][0];
    expect(call.data.action).toBe("APPLICATION_SUBMITTED");
    expect(call.data.entityType).toBe("PartnerApplication");
    expect(call.data.actorType).toBe("SYSTEM");
  });

  it("rejects duplicate email when an active application exists", async () => {
    const db = makeFakeDb({
      findFirst: vi.fn().mockResolvedValue({
        id: "existing_app",
        email: validInput.email,
        status: "SUBMITTED",
        fullName: "Existing Person",
      }),
    });

    await expect(submitApplication(validInput, db)).rejects.toThrow(
      /already under review/
    );
    expect(db.partnerApplication.create).not.toHaveBeenCalled();
  });

  it("allows submission when email has no active application", async () => {
    const db = makeFakeDb({ findFirst: vi.fn().mockResolvedValue(null) });
    const result = await submitApplication(validInput, db);
    expect(result).toBeDefined();
  });

  it("passes the correct status filter when checking duplicates", async () => {
    const db = makeFakeDb();
    await submitApplication(validInput, db);

    const call = vi.mocked(db.partnerApplication.findFirst).mock.calls[0][0];
    expect(call.where.email).toBe(validInput.email);
    expect(call.where.status.in).toContain("SUBMITTED");
    expect(call.where.status.in).toContain("IN_REVIEW");
    expect(call.where.status.in).toContain("APPROVED_PENDING_AGREEMENT");
  });

  it("throws a Zod validation error for invalid input", async () => {
    const db = makeFakeDb();
    const badInput = { ...validInput, email: "not-valid" } as ApplicationInput;
    await expect(submitApplication(badInput, db)).rejects.toThrow();
    expect(db.partnerApplication.create).not.toHaveBeenCalled();
  });
});
