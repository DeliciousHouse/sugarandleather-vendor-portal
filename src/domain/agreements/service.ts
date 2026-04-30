import { createAuditWriter } from "@/lib/audit";
import type { SessionUser } from "@/lib/access-control";
import type { EmailAdapter } from "@/lib/email";
import {
  renderAgreementPacketEmail,
  renderPartnerActivationEmail,
} from "@/emails/AgreementPacketEmail";

// ---------------------------------------------------------------------------
// Versions — override via env for future version bumps
// ---------------------------------------------------------------------------

const NDA_VERSION = process.env.NDA_VERSION ?? "1.0";
const AGREEMENT_VERSION = process.env.AGREEMENT_VERSION ?? "1.0";

// ---------------------------------------------------------------------------
// Allowed status transitions (workflow map)
// ---------------------------------------------------------------------------

const SENDABLE_APP_STATUSES = ["APPROVED_PENDING_AGREEMENT"] as const;
const SIGNABLE_AGREEMENT_STATUSES = ["SENT"] as const;

// ---------------------------------------------------------------------------
// Minimal DB interface
// ---------------------------------------------------------------------------

type AgreementRow = {
  id: string;
  status: string;
  applicationId: string | null;
  partnerId: string | null;
  signedEvidenceUrl: string | null;
  signedEvidenceNote: string | null;
  ndaVersion: string;
  agreementVersion: string;
  packetUrl: string | null;
};

type AppRow = {
  id: string;
  status: string;
  email: string;
  fullName: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyArgs = any;

type AgreementDb = {
  partnerApplication: {
    findUnique(args: AnyArgs): Promise<AppRow | null>;
    update(args: AnyArgs): Promise<AppRow>;
  };
  agreement: {
    findFirst(args: AnyArgs): Promise<AgreementRow | null>;
    create(args: AnyArgs): Promise<AgreementRow>;
    update(args: AnyArgs): Promise<AgreementRow>;
  };
  notification: {
    create(args: AnyArgs): Promise<{ id: string }>;
  };
  emailLog: {
    create(args: AnyArgs): Promise<{ id: string }>;
    update(args: AnyArgs): Promise<{ id: string }>;
  };
  user: {
    create(args: AnyArgs): Promise<{ id: string; email: string; name: string | null }>;
  };
  partner: {
    create(args: AnyArgs): Promise<{ id: string }>;
  };
  tier: {
    findFirst(args: AnyArgs): Promise<{ id: string; name: string } | null>;
  };
  auditLog: { create(args: AnyArgs): Promise<unknown> };
};

// ---------------------------------------------------------------------------
// sendAgreementPacket
// ---------------------------------------------------------------------------

export async function sendAgreementPacket(
  applicationId: string,
  actor: SessionUser,
  db: AgreementDb,
  email: EmailAdapter
): Promise<AgreementRow> {
  if (actor.role !== "ADMIN") {
    throw new Error("Forbidden: admin access required");
  }

  const app = await db.partnerApplication.findUnique({
    where: { id: applicationId },
  });
  if (!app) throw new Error("Application not found");

  const allowed: readonly string[] = SENDABLE_APP_STATUSES;
  if (!allowed.includes(app.status)) {
    throw new Error(
      `Cannot send agreement: application status is ${app.status}`
    );
  }

  const packetUrl =
    process.env.AGREEMENT_PACKET_URL ?? "https://sugarandleather.ai/agreement";

  // Check for an existing agreement to support explicit resend
  const existing = await db.agreement.findFirst({
    where: { applicationId },
  });

  let agreement: AgreementRow;

  if (existing) {
    // Resend: update sentAt only
    agreement = await db.agreement.update({
      where: { id: existing.id },
      data: { sentAt: new Date(), sentById: actor.id },
    });
  } else {
    agreement = await db.agreement.create({
      data: {
        applicationId,
        status: "SENT",
        ndaVersion: NDA_VERSION,
        agreementVersion: AGREEMENT_VERSION,
        packetUrl,
        sentAt: new Date(),
        sentById: actor.id,
      },
    });
  }

  // Create Notification + EmailLog records before sending
  const notification = await db.notification.create({
    data: {
      channel: "EMAIL",
      status: "QUEUED",
      title: "Agreement packet sent",
      body: `Agreement packet sent to ${app.email}`,
      entityType: "Agreement",
      entityId: agreement.id,
    },
  });

  const emailLog = await db.emailLog.create({
    data: {
      notificationId: notification.id,
      to: app.email,
      subject: "Your Sugar & Leather Partner Agreement",
      status: "QUEUED",
    },
  });

  // Update application status
  await db.partnerApplication.update({
    where: { id: applicationId },
    data: { status: "AGREEMENT_SENT" },
  });

  // Write audit log
  const audit = createAuditWriter(db);
  await audit(
    { type: "USER", id: actor.id },
    "AGREEMENT_PACKET_SENT",
    "Agreement",
    agreement.id,
    {
      after: {
        status: "SENT",
        applicationId,
        sentTo: app.email,
        resend: !!existing,
      },
    }
  );

  // Send email after DB writes — log result
  const { html, text } = renderAgreementPacketEmail({
    applicantName: app.fullName,
    packetUrl,
    ndaVersion: NDA_VERSION,
    agreementVersion: AGREEMENT_VERSION,
  });

  const result = await email.send({
    to: app.email,
    subject: "Your Sugar & Leather Partner Agreement",
    html,
    text,
  });

  const emailStatus = result.error ? "FAILED" : "SENT";
  await db.emailLog.update({
    where: { id: emailLog.id },
    data: {
      status: emailStatus,
      providerId: result.id,
      error: result.error ?? null,
      sentAt: emailStatus === "SENT" ? new Date() : null,
    },
  });

  return agreement;
}

// ---------------------------------------------------------------------------
// markAgreementSigned
// ---------------------------------------------------------------------------

export type SignedEvidence = {
  signedEvidenceUrl?: string;
  signedEvidenceNote?: string;
};

export async function markAgreementSigned(
  agreementId: string,
  evidence: SignedEvidence,
  actor: SessionUser,
  db: AgreementDb
): Promise<AgreementRow> {
  if (actor.role !== "ADMIN") {
    throw new Error("Forbidden: admin access required");
  }

  if (!evidence.signedEvidenceUrl && !evidence.signedEvidenceNote) {
    throw new Error(
      "Signed document URL or manual evidence note is required"
    );
  }

  const agreement = await db.agreement.findFirst({
    where: { id: agreementId },
  });
  if (!agreement) throw new Error("Agreement not found");

  const allowed: readonly string[] = SIGNABLE_AGREEMENT_STATUSES;
  if (!allowed.includes(agreement.status)) {
    throw new Error(`Cannot mark signed: agreement status is ${agreement.status}`);
  }

  const before = { status: agreement.status };
  const updated = await db.agreement.update({
    where: { id: agreementId },
    data: {
      status: "SIGNED",
      signedAt: new Date(),
      signedById: actor.id,
      signedEvidenceUrl: evidence.signedEvidenceUrl ?? null,
      signedEvidenceNote: evidence.signedEvidenceNote ?? null,
    },
  });

  const audit = createAuditWriter(db);
  await audit(
    { type: "USER", id: actor.id },
    "AGREEMENT_SIGNED",
    "Agreement",
    agreementId,
    { before, after: { status: "SIGNED" } }
  );

  return updated;
}

// ---------------------------------------------------------------------------
// activatePartnerFromSignedAgreement
// ---------------------------------------------------------------------------

export async function activatePartnerFromSignedAgreement(
  agreementId: string,
  actor: SessionUser,
  db: AgreementDb,
  email: EmailAdapter
): Promise<{ userId: string; partnerId: string }> {
  if (actor.role !== "ADMIN") {
    throw new Error("Forbidden: admin access required");
  }

  const agreement = await db.agreement.findFirst({
    where: { id: agreementId },
  });
  if (!agreement) throw new Error("Agreement not found");

  // Hard guard: signed evidence is required
  if (agreement.status !== "SIGNED") {
    throw new Error(
      `Cannot activate partner: agreement status is ${agreement.status}`
    );
  }
  if (!agreement.signedEvidenceUrl && !agreement.signedEvidenceNote) {
    throw new Error(
      "Cannot activate partner: no signed evidence on record"
    );
  }

  const applicationId = agreement.applicationId;
  if (!applicationId) {
    throw new Error("Agreement is not linked to an application");
  }

  const app = await db.partnerApplication.findUnique({
    where: { id: applicationId },
  });
  if (!app) throw new Error("Application not found");

  // Resolve default tier
  const tier = await db.tier.findFirst({
    where: { isDefault: true, isActive: true },
  });
  if (!tier) throw new Error("No default tier configured");

  // Create partner User
  const user = await db.user.create({
    data: {
      email: app.email,
      name: app.fullName,
      role: "PARTNER",
      status: "ACTIVE",
    },
  });

  // Create Partner record
  const partner = await db.partner.create({
    data: {
      userId: user.id,
      applicationId,
      tierId: tier.id,
      status: "ACTIVE",
      displayName: app.fullName,
      activatedAt: new Date(),
    },
  });

  // Update application status
  await db.partnerApplication.update({
    where: { id: applicationId },
    data: { status: "ACTIVATED" },
  });

  // Audit
  const audit = createAuditWriter(db);
  await audit(
    { type: "USER", id: actor.id },
    "PARTNER_ACTIVATED",
    "Partner",
    partner.id,
    {
      after: {
        status: "ACTIVE",
        userId: user.id,
        applicationId,
        agreementId,
      },
    }
  );

  // Send activation email after all DB writes
  const appUrl =
    process.env.APP_URL ?? "http://localhost:3000";
  const { html, text } = renderPartnerActivationEmail({
    partnerName: app.fullName,
    loginUrl: `${appUrl}/login`,
  });

  const emailLogCreate = await db.emailLog.create({
    data: {
      to: app.email,
      subject: "Welcome to the Sugar & Leather Partner Program",
      status: "QUEUED",
    },
  });

  const result = await email.send({
    to: app.email,
    subject: "Welcome to the Sugar & Leather Partner Program",
    html,
    text,
  });

  await db.emailLog.update({
    where: { id: emailLogCreate.id },
    data: {
      status: result.error ? "FAILED" : "SENT",
      providerId: result.id,
      error: result.error ?? null,
      sentAt: result.error ? null : new Date(),
    },
  });

  return { userId: user.id, partnerId: partner.id };
}
