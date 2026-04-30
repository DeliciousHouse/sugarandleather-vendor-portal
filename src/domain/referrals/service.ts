import { normalizeAttributionKey } from "./normalize";
import { buildAuditPayload, writeAuditLog, type Actor, type AuditClient } from "@/lib/audit";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ReferralInput = {
  partnerId: string;
  leadName: string;
  leadEmail?: string | null;
  leadCompany?: string | null;
  leadDomain?: string | null;
  country?: string | null;
  notes?: string | null;
};

export type CreatedReferral = {
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

type ReferralCreateClient = {
  create: (args: { data: unknown }) => Promise<CreatedReferral>;
};

type AttributionLockCreateClient = {
  create: (args: { data: unknown }) => Promise<unknown>;
  findUnique: (args: { where: { key: string } }) => Promise<unknown>;
  update: (args: { where: { key: string }; data: unknown }) => Promise<unknown>;
};

export type ReferralDb = AuditClient & {
  $transaction: <T>(fn: (tx: ReferralDb) => Promise<T>) => Promise<T>;
  referral: ReferralCreateClient;
  attributionLock: AttributionLockCreateClient;
};

export type ReferralServiceDeps = {
  db: ReferralDb;
  actor: Actor;
};

// Prisma unique constraint error code
const PRISMA_UNIQUE_VIOLATION = "P2002";

function isPrismaUniqueError(err: unknown): boolean {
  return (
    err instanceof Error &&
    ("code" in err
      ? (err as NodeJS.ErrnoException).code === PRISMA_UNIQUE_VIOLATION
      : err.message.includes("Unique constraint"))
  );
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validateInput(input: ReferralInput): void {
  if (!input.partnerId?.trim()) {
    throw new Error("Validation error: partnerId is required");
  }
  if (!input.leadName?.trim()) {
    throw new Error("Validation error: leadName is required");
  }
  // normalizeAttributionKey will throw if both email and domain are absent
  normalizeAttributionKey({
    leadEmail: input.leadEmail,
    leadDomain: input.leadDomain,
  });
}

// ---------------------------------------------------------------------------
// submitReferral
// ---------------------------------------------------------------------------

export async function submitReferral(
  input: ReferralInput,
  deps: ReferralServiceDeps
): Promise<CreatedReferral> {
  validateInput(input);

  const attributionKey = normalizeAttributionKey({
    leadEmail: input.leadEmail,
    leadDomain: input.leadDomain,
  });

  const originalPayload: Record<string, unknown> = {
    leadName: input.leadName,
    leadEmail: input.leadEmail ?? null,
    leadCompany: input.leadCompany ?? null,
    leadDomain: input.leadDomain ?? null,
    country: input.country ?? null,
    notes: input.notes ?? null,
  };

  return deps.db.$transaction(async (tx) => {
    let attributionStatus: "FIRST_ATTRIBUTED" | "DUPLICATE_NO_CREDIT";
    let firstAttribution = false;

    try {
      await tx.attributionLock.create({
        data: {
          key: attributionKey,
          partnerId: input.partnerId,
          firstReferralId: null,
        },
      });
      attributionStatus = "FIRST_ATTRIBUTED";
      firstAttribution = true;
    } catch (err) {
      if (isPrismaUniqueError(err)) {
        attributionStatus = "DUPLICATE_NO_CREDIT";
      } else {
        throw err;
      }
    }

    const referral = await tx.referral.create({
      data: {
        partnerId: input.partnerId,
        attributionKey,
        attributionStatus,
        status: "PENDING_REVIEW",
        leadName: input.leadName,
        leadEmail: input.leadEmail ?? null,
        leadCompany: input.leadCompany ?? null,
        leadDomain: input.leadDomain ?? null,
        country: input.country ?? null,
        notes: input.notes ?? null,
        originalPayload,
      },
    });

    if (firstAttribution) {
      await tx.attributionLock.update({
        where: { key: attributionKey },
        data: { firstReferralId: referral.id },
      });
    }

    const auditPayload = buildAuditPayload(
      deps.actor,
      "REFERRAL_SUBMITTED",
      "Referral",
      referral.id,
      {
        after: {
          partnerId: input.partnerId,
          attributionKey,
          attributionStatus,
          status: "PENDING_REVIEW",
        },
      }
    );
    await writeAuditLog(tx, auditPayload);

    return referral;
  });
}

// ---------------------------------------------------------------------------
// Review service
// ---------------------------------------------------------------------------

export type ReviewReferralInput = {
  referralId: string;
  action: "APPROVE" | "REJECT";
  adminNotes?: string | null;
  reviewedById: string;
};

type ReferralRecord = {
  id: string;
  status: string;
  attributionStatus: string;
  partnerId: string;
};

type ReferralUpdateClient = {
  findUnique: (args: { where: { id: string } }) => Promise<ReferralRecord | null>;
  update: (args: { where: { id: string }; data: unknown }) => Promise<ReferralRecord>;
};

export type ReviewDb = AuditClient & {
  referral: ReferralUpdateClient;
};

export type ReviewServiceDeps = {
  db: ReviewDb;
  actor: Actor;
};

const REVIEWABLE_STATUSES = new Set(["PENDING_REVIEW"]);

export async function reviewReferral(
  input: ReviewReferralInput,
  deps: ReviewServiceDeps
): Promise<ReferralRecord> {
  const referral = await deps.db.referral.findUnique({
    where: { id: input.referralId },
  });

  if (!referral) {
    throw new Error(`Referral not found: ${input.referralId}`);
  }

  if (!REVIEWABLE_STATUSES.has(referral.status)) {
    throw new Error(
      `Cannot review referral in status ${referral.status}. Only PENDING_REVIEW referrals can be reviewed.`
    );
  }

  if (
    input.action === "APPROVE" &&
    referral.attributionStatus === "DUPLICATE_NO_CREDIT"
  ) {
    throw new Error(
      "Cannot approve a DUPLICATE_NO_CREDIT referral as counting. Approval is blocked."
    );
  }

  const newStatus = input.action === "APPROVE" ? "APPROVED" : "REJECTED";

  const updated = await deps.db.referral.update({
    where: { id: input.referralId },
    data: {
      status: newStatus,
      adminNotes: input.adminNotes ?? null,
      reviewedById: input.reviewedById,
      reviewedAt: new Date(),
    },
  });

  const auditPayload = buildAuditPayload(
    deps.actor,
    input.action === "APPROVE" ? "REFERRAL_APPROVED" : "REFERRAL_REJECTED",
    "Referral",
    referral.id,
    {
      before: { status: referral.status },
      after: { status: newStatus, adminNotes: input.adminNotes ?? null },
      reason: input.adminNotes ?? undefined,
    }
  );
  await writeAuditLog(deps.db, auditPayload);

  return updated;
}
