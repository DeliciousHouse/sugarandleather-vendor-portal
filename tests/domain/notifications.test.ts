import { describe, it, expect, vi } from "vitest";
import {
  createInAppNotification,
  createEmailNotification,
  notifyApplicationApproved,
  notifyAgreementSent,
  notifyReferralApproved,
  notifyReferralRejected,
  notifyDealWon,
  notifyDealLost,
  notifyCommissionPayable,
  notifyClawback,
  getAdminNotifications,
  markNotificationRead,
  type NotificationDb,
  type NotificationRow,
} from "@/domain/notifications/service";
import type { EmailAdapter } from "@/lib/email";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeNotification(overrides?: Partial<NotificationRow>): NotificationRow {
  return {
    id: "notif_1",
    userId: "user_1",
    channel: "IN_APP",
    status: "QUEUED",
    title: "Test notification",
    body: "Test body",
    entityType: "Deal",
    entityId: "deal_1",
    readAt: null,
    createdAt: new Date("2025-01-15"),
    updatedAt: new Date("2025-01-15"),
    ...overrides,
  };
}

function makeDb(opts?: { existing?: NotificationRow | null }): NotificationDb {
  return {
    notification: {
      findFirst: vi.fn(async () => opts?.existing ?? null),
      create: vi.fn(async ({ data }: { data: object }) => ({
        id: "notif_new",
        readAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      })),
      update: vi.fn(async ({ data }: { where: object; data: object }) => ({
        ...makeNotification(),
        ...data,
        updatedAt: new Date(),
      })),
      findMany: vi.fn(async () => [makeNotification()]),
      count: vi.fn(async () => 1),
    },
    emailLog: {
      create: vi.fn(async ({ data }: { data: object }) => ({
        id: "emaillog_1",
        notificationId: null,
        providerId: null,
        error: null,
        sentAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      })),
      update: vi.fn(async ({ data }: { where: object; data: object }) => ({
        id: "emaillog_1",
        to: "test@example.com",
        subject: "Test",
        notificationId: null,
        providerId: null,
        error: null,
        sentAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      })),
    },
  } as unknown as NotificationDb;
}

function makeEmailAdapter(opts?: { error?: string }): EmailAdapter {
  return {
    send: vi.fn(async () =>
      opts?.error ? { error: opts.error } : { id: "email_id_123" }
    ),
  };
}

// ---------------------------------------------------------------------------
// createInAppNotification
// ---------------------------------------------------------------------------

describe("createInAppNotification", () => {
  it("creates a notification when none exists", async () => {
    const db = makeDb();
    const result = await createInAppNotification(
      {
        userId: "user_1",
        title: "Deal won",
        body: "Your deal was won",
        entityType: "Deal",
        entityId: "deal_1",
      },
      db
    );
    expect(db.notification.create).toHaveBeenCalledOnce();
    expect(result.channel).toBe("IN_APP");
  });

  it("returns existing notification without creating a duplicate (idempotency)", async () => {
    const existing = makeNotification({ title: "Deal won" });
    const db = makeDb({ existing });
    const result = await createInAppNotification(
      {
        userId: "user_1",
        title: "Deal won",
        body: "Your deal was won",
        entityType: "Deal",
        entityId: "deal_1",
      },
      db
    );
    expect(db.notification.create).not.toHaveBeenCalled();
    expect(result.id).toBe(existing.id);
  });

  it("skips idempotency check when entityType/entityId are absent", async () => {
    const db = makeDb({ existing: makeNotification() });
    await createInAppNotification(
      { userId: "user_1", title: "Generic note", body: "Body" },
      db
    );
    // findFirst should not have been called since we have no entityType/entityId
    expect(db.notification.findFirst).not.toHaveBeenCalled();
    expect(db.notification.create).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// createEmailNotification
// ---------------------------------------------------------------------------

describe("createEmailNotification", () => {
  it("creates notification and emailLog records, then sends email", async () => {
    const db = makeDb();
    const emailAdapter = makeEmailAdapter();
    await createEmailNotification(
      {
        to: "partner@example.com",
        title: "Agreement sent",
        body: "Please review and sign",
        entityType: "Agreement",
        entityId: "agr_1",
      },
      db,
      emailAdapter
    );
    expect(db.notification.create).toHaveBeenCalledOnce();
    expect(db.emailLog.create).toHaveBeenCalledOnce();
    expect(emailAdapter.send).toHaveBeenCalledOnce();
  });

  it("marks emailLog SENT when send succeeds", async () => {
    const db = makeDb();
    const emailAdapter = makeEmailAdapter();
    await createEmailNotification(
      { to: "p@example.com", title: "T", body: "B", entityType: "A", entityId: "1" },
      db,
      emailAdapter
    );
    const updateCall = vi.mocked(db.emailLog.update).mock.calls[0][0];
    expect(updateCall.data.status).toBe("SENT");
    expect(updateCall.data.providerId).toBe("email_id_123");
  });

  it("marks emailLog FAILED when send fails without throwing", async () => {
    const db = makeDb();
    const emailAdapter = makeEmailAdapter({ error: "network error" });
    await createEmailNotification(
      { to: "p@example.com", title: "T", body: "B", entityType: "A", entityId: "1" },
      db,
      emailAdapter
    );
    const updateCall = vi.mocked(db.emailLog.update).mock.calls[0][0];
    expect(updateCall.data.status).toBe("FAILED");
    expect(updateCall.data.error).toBe("network error");
  });

  it("is idempotent — returns existing notification without resending", async () => {
    const existing = makeNotification({ channel: "EMAIL" });
    const db = makeDb({ existing });
    const emailAdapter = makeEmailAdapter();
    const result = await createEmailNotification(
      {
        to: "p@example.com",
        title: existing.title,
        body: "Body",
        entityType: existing.entityType!,
        entityId: existing.entityId!,
      },
      db,
      emailAdapter
    );
    expect(db.notification.create).not.toHaveBeenCalled();
    expect(emailAdapter.send).not.toHaveBeenCalled();
    expect(result.id).toBe(existing.id);
  });
});

// ---------------------------------------------------------------------------
// Workflow event helpers
// ---------------------------------------------------------------------------

const workflowInput = {
  entityType: "PartnerApplication",
  entityId: "app_1",
  partnerUserId: "user_1",
};

describe("notifyApplicationApproved", () => {
  it("creates an in-app notification with the correct title", async () => {
    const db = makeDb();
    await notifyApplicationApproved(workflowInput, db);
    expect(db.notification.create).toHaveBeenCalledOnce();
    const call = vi.mocked(db.notification.create).mock.calls[0][0];
    expect(call.data.title).toBe("Application approved");
    expect(call.data.channel).toBe("IN_APP");
  });

  it("is idempotent on retry", async () => {
    const existing = makeNotification({
      title: "Application approved",
      entityType: "PartnerApplication",
      entityId: "app_1",
    });
    const db = makeDb({ existing });
    await notifyApplicationApproved(workflowInput, db);
    expect(db.notification.create).not.toHaveBeenCalled();
  });
});

describe("notifyAgreementSent", () => {
  it("creates an in-app notification", async () => {
    const db = makeDb();
    await notifyAgreementSent(
      { entityType: "Agreement", entityId: "agr_1", partnerUserId: "user_1" },
      db
    );
    const call = vi.mocked(db.notification.create).mock.calls[0][0];
    expect(call.data.title).toBe("Agreement sent");
    expect(call.data.channel).toBe("IN_APP");
  });
});

describe("notifyReferralApproved", () => {
  it("creates an in-app notification", async () => {
    const db = makeDb();
    await notifyReferralApproved(
      { entityType: "Referral", entityId: "ref_1", partnerUserId: "user_1" },
      db
    );
    const call = vi.mocked(db.notification.create).mock.calls[0][0];
    expect(call.data.title).toBe("Referral approved");
  });

  it("is idempotent on retry", async () => {
    const existing = makeNotification({
      title: "Referral approved",
      entityType: "Referral",
      entityId: "ref_1",
    });
    const db = makeDb({ existing });
    await notifyReferralApproved(
      { entityType: "Referral", entityId: "ref_1", partnerUserId: "user_1" },
      db
    );
    expect(db.notification.create).not.toHaveBeenCalled();
  });
});

describe("notifyReferralRejected", () => {
  it("creates an in-app notification", async () => {
    const db = makeDb();
    await notifyReferralRejected(
      { entityType: "Referral", entityId: "ref_1", partnerUserId: "user_1" },
      db
    );
    const call = vi.mocked(db.notification.create).mock.calls[0][0];
    expect(call.data.title).toBe("Referral not approved");
  });
});

describe("notifyDealWon", () => {
  it("creates an in-app notification", async () => {
    const db = makeDb();
    await notifyDealWon(
      { entityType: "Deal", entityId: "deal_1", partnerUserId: "user_1" },
      db
    );
    const call = vi.mocked(db.notification.create).mock.calls[0][0];
    expect(call.data.title).toBe("Deal won");
  });

  it("is idempotent on retry", async () => {
    const existing = makeNotification({
      title: "Deal won",
      entityType: "Deal",
      entityId: "deal_1",
    });
    const db = makeDb({ existing });
    await notifyDealWon(
      { entityType: "Deal", entityId: "deal_1", partnerUserId: "user_1" },
      db
    );
    expect(db.notification.create).not.toHaveBeenCalled();
  });
});

describe("notifyDealLost", () => {
  it("creates an in-app notification", async () => {
    const db = makeDb();
    await notifyDealLost(
      { entityType: "Deal", entityId: "deal_1", partnerUserId: "user_1" },
      db
    );
    const call = vi.mocked(db.notification.create).mock.calls[0][0];
    expect(call.data.title).toBe("Deal lost");
  });
});

describe("notifyCommissionPayable", () => {
  it("creates an in-app notification", async () => {
    const db = makeDb();
    await notifyCommissionPayable(
      { entityType: "CommissionEvent", entityId: "ce_1", partnerUserId: "user_1" },
      db
    );
    const call = vi.mocked(db.notification.create).mock.calls[0][0];
    expect(call.data.title).toBe("Commission payable");
  });

  it("is idempotent on retry", async () => {
    const existing = makeNotification({
      title: "Commission payable",
      entityType: "CommissionEvent",
      entityId: "ce_1",
    });
    const db = makeDb({ existing });
    await notifyCommissionPayable(
      { entityType: "CommissionEvent", entityId: "ce_1", partnerUserId: "user_1" },
      db
    );
    expect(db.notification.create).not.toHaveBeenCalled();
  });
});

describe("notifyClawback", () => {
  it("creates an in-app notification", async () => {
    const db = makeDb();
    await notifyClawback(
      { entityType: "CommissionEvent", entityId: "ce_2", partnerUserId: "user_1" },
      db
    );
    const call = vi.mocked(db.notification.create).mock.calls[0][0];
    expect(call.data.title).toBe("Commission clawback applied");
  });

  it("is idempotent on retry", async () => {
    const existing = makeNotification({
      title: "Commission clawback applied",
      entityType: "CommissionEvent",
      entityId: "ce_2",
    });
    const db = makeDb({ existing });
    await notifyClawback(
      { entityType: "CommissionEvent", entityId: "ce_2", partnerUserId: "user_1" },
      db
    );
    expect(db.notification.create).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// getAdminNotifications
// ---------------------------------------------------------------------------

describe("getAdminNotifications", () => {
  it("returns notifications ordered by createdAt desc", async () => {
    const db = makeDb();
    const result = await getAdminNotifications(db);
    expect(db.notification.findMany).toHaveBeenCalledOnce();
    const call = vi.mocked(db.notification.findMany).mock.calls[0][0];
    expect(call.orderBy).toMatchObject({ createdAt: "desc" });
    expect(Array.isArray(result)).toBe(true);
  });

  it("defaults to take=50", async () => {
    const db = makeDb();
    await getAdminNotifications(db);
    const call = vi.mocked(db.notification.findMany).mock.calls[0][0];
    expect(call.take).toBe(50);
  });
});

// ---------------------------------------------------------------------------
// markNotificationRead
// ---------------------------------------------------------------------------

describe("markNotificationRead", () => {
  it("updates status to READ and sets readAt", async () => {
    const db = makeDb();
    await markNotificationRead("notif_1", db);
    const call = vi.mocked(db.notification.update).mock.calls[0][0];
    expect(call.data.status).toBe("READ");
    expect(call.data.readAt).toBeInstanceOf(Date);
  });
});
