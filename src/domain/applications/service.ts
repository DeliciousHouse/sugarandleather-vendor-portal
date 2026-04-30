import { createAuditWriter } from "@/lib/audit";
import type { SessionUser } from "@/lib/access-control";
import { ApplicationSchema, type ApplicationInput } from "./schema";

// ---------------------------------------------------------------------------
// Minimal DB interface — satisfied structurally by PrismaClient
// ---------------------------------------------------------------------------

type AppRow = {
  id: string;
  status: string;
  email: string;
  fullName: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyArgs = any;

type ApplicationDb = {
  partnerApplication: {
    findFirst(args: AnyArgs): Promise<AppRow | null>;
    findUnique(args: AnyArgs): Promise<AppRow | null>;
    create(args: AnyArgs): Promise<AppRow>;
    update(args: AnyArgs): Promise<AppRow>;
  };
  auditLog: { create(args: AnyArgs): Promise<unknown> };
};

// ---------------------------------------------------------------------------
// Status workflow maps
// ---------------------------------------------------------------------------

const ACTIVE_APPLICATION_STATUSES = [
  "SUBMITTED",
  "IN_REVIEW",
  "APPROVED_PENDING_AGREEMENT",
  "AGREEMENT_SENT",
  "SIGNED",
  "ACTIVATED",
] as const;

const REJECTABLE_STATUSES = ["SUBMITTED", "IN_REVIEW"] as const;
const APPROVABLE_STATUSES = ["SUBMITTED", "IN_REVIEW"] as const;
const MARK_IN_REVIEW_FROM = ["SUBMITTED"] as const;

// ---------------------------------------------------------------------------
// Task 8 — submit
// ---------------------------------------------------------------------------

export async function submitApplication(
  input: ApplicationInput,
  db: ApplicationDb
): Promise<AppRow> {
  const data = ApplicationSchema.parse(input);

  const existing = await db.partnerApplication.findFirst({
    where: {
      email: data.email,
      status: { in: ACTIVE_APPLICATION_STATUSES },
    },
  });

  if (existing) {
    throw new Error(
      "An application with this email address is already under review"
    );
  }

  const application = await db.partnerApplication.create({
    data: {
      ...data,
      status: "SUBMITTED",
    },
  });

  const audit = createAuditWriter(db);
  await audit(
    { type: "SYSTEM" },
    "APPLICATION_SUBMITTED",
    "PartnerApplication",
    application.id,
    { after: { status: "SUBMITTED", email: data.email } }
  );

  return application;
}

// ---------------------------------------------------------------------------
// Task 10 — review transitions
// ---------------------------------------------------------------------------

export async function markInReview(
  applicationId: string,
  actor: SessionUser,
  db: ApplicationDb
): Promise<AppRow> {
  if (actor.role !== "ADMIN") {
    throw new Error("Forbidden: admin access required");
  }

  const app = await db.partnerApplication.findUnique({
    where: { id: applicationId },
  });
  if (!app) throw new Error("Application not found");

  const allowed: readonly string[] = MARK_IN_REVIEW_FROM;
  if (!allowed.includes(app.status)) {
    throw new Error(`Cannot mark in review: status is ${app.status}`);
  }

  const before = { status: app.status };
  const updated = await db.partnerApplication.update({
    where: { id: applicationId },
    data: {
      status: "IN_REVIEW",
      reviewedById: actor.id,
      reviewedAt: new Date(),
    },
  });

  const audit = createAuditWriter(db);
  await audit(
    { type: "USER", id: actor.id },
    "APPLICATION_MARKED_IN_REVIEW",
    "PartnerApplication",
    applicationId,
    { before, after: { status: "IN_REVIEW" } }
  );

  return updated;
}

export async function rejectApplication(
  applicationId: string,
  notes: string,
  actor: SessionUser,
  db: ApplicationDb
): Promise<AppRow> {
  if (actor.role !== "ADMIN") {
    throw new Error("Forbidden: admin access required");
  }

  const app = await db.partnerApplication.findUnique({
    where: { id: applicationId },
  });
  if (!app) throw new Error("Application not found");

  const allowed: readonly string[] = REJECTABLE_STATUSES;
  if (!allowed.includes(app.status)) {
    throw new Error(`Cannot reject application in status ${app.status}`);
  }

  const before = { status: app.status };
  const updated = await db.partnerApplication.update({
    where: { id: applicationId },
    data: {
      status: "REJECTED",
      reviewedById: actor.id,
      reviewedAt: new Date(),
      reviewNotes: notes,
    },
  });

  const audit = createAuditWriter(db);
  await audit(
    { type: "USER", id: actor.id },
    "APPLICATION_REJECTED",
    "PartnerApplication",
    applicationId,
    { before, after: { status: "REJECTED" }, reason: notes }
  );

  return updated;
}

export async function approvePendingAgreement(
  applicationId: string,
  notes: string | undefined,
  actor: SessionUser,
  db: ApplicationDb
): Promise<AppRow> {
  if (actor.role !== "ADMIN") {
    throw new Error("Forbidden: admin access required");
  }

  const app = await db.partnerApplication.findUnique({
    where: { id: applicationId },
  });
  if (!app) throw new Error("Application not found");

  const allowed: readonly string[] = APPROVABLE_STATUSES;
  if (!allowed.includes(app.status)) {
    throw new Error(
      `Cannot approve application in status ${app.status}`
    );
  }

  const before = { status: app.status };
  const updated = await db.partnerApplication.update({
    where: { id: applicationId },
    data: {
      status: "APPROVED_PENDING_AGREEMENT",
      reviewedById: actor.id,
      reviewedAt: new Date(),
      reviewNotes: notes ?? null,
    },
  });

  const audit = createAuditWriter(db);
  await audit(
    { type: "USER", id: actor.id },
    "APPLICATION_APPROVED_PENDING_AGREEMENT",
    "PartnerApplication",
    applicationId,
    { before, after: { status: "APPROVED_PENDING_AGREEMENT" } }
  );

  return updated;
}
