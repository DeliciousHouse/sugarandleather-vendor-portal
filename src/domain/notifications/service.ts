import type { EmailAdapter } from "@/lib/email";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Row types
// ---------------------------------------------------------------------------

export type NotificationRow = {
  id: string;
  userId: string | null;
  channel: string;
  status: string;
  title: string;
  body: string;
  entityType: string | null;
  entityId: string | null;
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type EmailLogRow = {
  id: string;
  notificationId: string | null;
  to: string;
  subject: string;
  status: string;
  providerId: string | null;
  error: string | null;
  sentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyArgs = any;

// ---------------------------------------------------------------------------
// DB interface
// ---------------------------------------------------------------------------

export type NotificationDb = {
  notification: {
    findFirst: (args: AnyArgs) => Promise<NotificationRow | null>;
    create: (args: AnyArgs) => Promise<NotificationRow>;
    update: (args: AnyArgs) => Promise<NotificationRow>;
    findMany: (args: AnyArgs) => Promise<NotificationRow[]>;
    count: (args: AnyArgs) => Promise<number>;
  };
  emailLog: {
    create: (args: AnyArgs) => Promise<EmailLogRow>;
    update: (args: AnyArgs) => Promise<EmailLogRow>;
  };
};

// ---------------------------------------------------------------------------
// Idempotency check
// Duplicate = same userId + channel + entityType + entityId + title.
// If entityType/entityId are absent the check is skipped (non-deduplicable).
// ---------------------------------------------------------------------------

async function findExistingNotification(
  db: NotificationDb,
  key: {
    userId: string | null;
    channel: string;
    entityType: string | null;
    entityId: string | null;
    title: string;
  }
): Promise<NotificationRow | null> {
  if (!key.entityType || !key.entityId) return null;
  return db.notification.findFirst({
    where: {
      userId: key.userId,
      channel: key.channel,
      entityType: key.entityType,
      entityId: key.entityId,
      title: key.title,
    },
  });
}

// ---------------------------------------------------------------------------
// Core create helpers
// ---------------------------------------------------------------------------

export type CreateInAppInput = {
  userId?: string | null;
  title: string;
  body: string;
  entityType?: string | null;
  entityId?: string | null;
};

export async function createInAppNotification(
  input: CreateInAppInput,
  db: NotificationDb
): Promise<NotificationRow> {
  const existing = await findExistingNotification(db, {
    userId: input.userId ?? null,
    channel: "IN_APP",
    entityType: input.entityType ?? null,
    entityId: input.entityId ?? null,
    title: input.title,
  });
  if (existing) return existing;

  return db.notification.create({
    data: {
      userId: input.userId ?? null,
      channel: "IN_APP",
      status: "QUEUED",
      title: input.title,
      body: input.body,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
    },
  });
}

export type CreateEmailInput = {
  userId?: string | null;
  to: string;
  title: string;
  body: string;
  htmlBody?: string;
  entityType?: string | null;
  entityId?: string | null;
};

export async function createEmailNotification(
  input: CreateEmailInput,
  db: NotificationDb,
  emailAdapter: EmailAdapter
): Promise<NotificationRow> {
  const existing = await findExistingNotification(db, {
    userId: input.userId ?? null,
    channel: "EMAIL",
    entityType: input.entityType ?? null,
    entityId: input.entityId ?? null,
    title: input.title,
  });
  if (existing) return existing;

  // Persist Notification + EmailLog records before sending
  const notification = await db.notification.create({
    data: {
      userId: input.userId ?? null,
      channel: "EMAIL",
      status: "QUEUED",
      title: input.title,
      body: input.body,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
    },
  });

  const emailLog = await db.emailLog.create({
    data: {
      notificationId: notification.id,
      to: input.to,
      subject: input.title,
      status: "QUEUED",
    },
  });

  // Send email after all DB writes — never inside a transaction
  const result = await emailAdapter.send({
    to: input.to,
    subject: input.title,
    html: input.htmlBody ?? `<p>${input.body}</p>`,
    text: input.body,
  });

  if (result.error) {
    await db.emailLog.update({
      where: { id: emailLog.id },
      data: { status: "FAILED", error: result.error },
    });
    return notification;
  }

  await db.emailLog.update({
    where: { id: emailLog.id },
    data: {
      status: "SENT",
      providerId: result.id ?? null,
      sentAt: new Date(),
    },
  });

  return db.notification.update({
    where: { id: notification.id },
    data: { status: "SENT" },
  });
}

// ---------------------------------------------------------------------------
// Workflow event helpers
// These are called by other domain services at state transition points.
// Each is idempotent — safe to call on retry.
// ---------------------------------------------------------------------------

export type WorkflowNotifyInput = {
  entityType: string;
  entityId: string;
  partnerUserId?: string | null;
};

export async function notifyApplicationApproved(
  input: WorkflowNotifyInput,
  db: NotificationDb
): Promise<void> {
  await createInAppNotification(
    {
      userId: input.partnerUserId,
      title: "Application approved",
      body: "Your application has been approved. Your partner agreement will be sent shortly.",
      entityType: input.entityType,
      entityId: input.entityId,
    },
    db
  );
}

export async function notifyAgreementSent(
  input: WorkflowNotifyInput,
  db: NotificationDb
): Promise<void> {
  await createInAppNotification(
    {
      userId: input.partnerUserId,
      title: "Agreement sent",
      body: "Your partner agreement has been sent. Please review and sign to activate your account.",
      entityType: input.entityType,
      entityId: input.entityId,
    },
    db
  );
}

export async function notifyReferralApproved(
  input: WorkflowNotifyInput,
  db: NotificationDb
): Promise<void> {
  await createInAppNotification(
    {
      userId: input.partnerUserId,
      title: "Referral approved",
      body: "Your referral has been approved and is now eligible for deal tracking.",
      entityType: input.entityType,
      entityId: input.entityId,
    },
    db
  );
}

export async function notifyReferralRejected(
  input: WorkflowNotifyInput,
  db: NotificationDb
): Promise<void> {
  await createInAppNotification(
    {
      userId: input.partnerUserId,
      title: "Referral not approved",
      body: "Your referral was not approved. Contact your account manager for more information.",
      entityType: input.entityType,
      entityId: input.entityId,
    },
    db
  );
}

export async function notifyDealWon(
  input: WorkflowNotifyInput,
  db: NotificationDb
): Promise<void> {
  await createInAppNotification(
    {
      userId: input.partnerUserId,
      title: "Deal won",
      body: "A deal linked to your referral has been marked won. Commission events are being staged.",
      entityType: input.entityType,
      entityId: input.entityId,
    },
    db
  );
}

export async function notifyDealLost(
  input: WorkflowNotifyInput,
  db: NotificationDb
): Promise<void> {
  await createInAppNotification(
    {
      userId: input.partnerUserId,
      title: "Deal lost",
      body: "A deal linked to your referral has been marked lost.",
      entityType: input.entityType,
      entityId: input.entityId,
    },
    db
  );
}

export async function notifyCommissionPayable(
  input: WorkflowNotifyInput,
  db: NotificationDb
): Promise<void> {
  await createInAppNotification(
    {
      userId: input.partnerUserId,
      title: "Commission payable",
      body: "A commission event is now payable. Check your earnings dashboard for details.",
      entityType: input.entityType,
      entityId: input.entityId,
    },
    db
  );
}

export async function notifyClawback(
  input: WorkflowNotifyInput,
  db: NotificationDb
): Promise<void> {
  await createInAppNotification(
    {
      userId: input.partnerUserId,
      title: "Commission clawback applied",
      body: "A commission clawback has been applied to your account. Check your earnings for details.",
      entityType: input.entityType,
      entityId: input.entityId,
    },
    db
  );
}

// ---------------------------------------------------------------------------
// Query helpers for pages
// ---------------------------------------------------------------------------

export type GetAdminNotificationsOpts = {
  take?: number;
  skip?: number;
};

export async function getAdminNotifications(
  db: NotificationDb,
  opts?: GetAdminNotificationsOpts
): Promise<NotificationRow[]> {
  return db.notification.findMany({
    orderBy: { createdAt: "desc" },
    take: opts?.take ?? 50,
    skip: opts?.skip ?? 0,
  });
}

export async function getAdminNotificationsForPage(
  opts?: GetAdminNotificationsOpts
): Promise<NotificationRow[]> {
  return getAdminNotifications(prisma as unknown as NotificationDb, opts);
}

export async function getPartnerNotifications(
  db: NotificationDb,
  userId: string,
  opts?: GetAdminNotificationsOpts
): Promise<NotificationRow[]> {
  return db.notification.findMany({
    where: { userId, channel: "IN_APP" },
    orderBy: { createdAt: "desc" },
    take: opts?.take ?? 20,
    skip: opts?.skip ?? 0,
  });
}

export async function markNotificationRead(
  notificationId: string,
  db: NotificationDb
): Promise<NotificationRow> {
  return db.notification.update({
    where: { id: notificationId },
    data: { status: "READ", readAt: new Date() },
  });
}
