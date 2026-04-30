import { describe, it, expect, vi } from "vitest";
import {
  sendAgreementPacket,
  markAgreementSigned,
  activatePartnerFromSignedAgreement,
} from "@/domain/agreements/service";
import type { SessionUser } from "@/lib/access-control";
import type { EmailAdapter } from "@/lib/email";

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
    status: "APPROVED_PENDING_AGREEMENT",
    email: "applicant@example.com",
    fullName: "Jane Smith",
    ...overrides,
  };
}

function makeAgreement(
  overrides?: Partial<{
    id: string;
    status: string;
    applicationId: string | null;
    partnerId: string | null;
    signedEvidenceUrl: string | null;
    signedEvidenceNote: string | null;
    ndaVersion: string;
    agreementVersion: string;
    packetUrl: string | null;
  }>
) {
  return {
    id: "agr_1",
    status: "SENT",
    applicationId: "app_1",
    partnerId: null,
    signedEvidenceUrl: null,
    signedEvidenceNote: null,
    ndaVersion: "1.0",
    agreementVersion: "1.0",
    packetUrl: "https://example.com/packet",
    ...overrides,
  };
}

function makeStubEmail(overrides?: Partial<EmailAdapter>): EmailAdapter {
  return {
    send: vi.fn().mockResolvedValue({ id: "email_test_1" }),
    ...overrides,
  };
}

function makeFakeDb(opts?: {
  app?: ReturnType<typeof makeApp> | null;
  agreement?: ReturnType<typeof makeAgreement> | null;
  tier?: { id: string; name: string } | null;
}) {
  const app = opts?.app !== undefined ? opts.app : makeApp();
  const agreement = opts?.agreement !== undefined ? opts.agreement : null;
  const tier =
    opts?.tier !== undefined ? opts.tier : { id: "tier_1", name: "Affiliate" };

  return {
    partnerApplication: {
      findUnique: vi.fn().mockResolvedValue(app),
      update: vi
        .fn()
        .mockImplementation(
          ({ data }: { data: Record<string, unknown> }) =>
            Promise.resolve({ ...app, ...data })
        ),
    },
    agreement: {
      findFirst: vi.fn().mockResolvedValue(agreement),
      create: vi
        .fn()
        .mockImplementation(
          ({ data }: { data: Record<string, unknown> }) =>
            Promise.resolve({ id: "agr_new", status: "SENT", ...data })
        ),
      update: vi
        .fn()
        .mockImplementation(
          ({ data }: { data: Record<string, unknown> }) =>
            Promise.resolve({ ...makeAgreement(), ...data })
        ),
    },
    notification: {
      create: vi.fn().mockResolvedValue({ id: "notif_1" }),
    },
    emailLog: {
      create: vi.fn().mockResolvedValue({ id: "elog_1" }),
      update: vi.fn().mockResolvedValue({ id: "elog_1" }),
    },
    user: {
      create: vi
        .fn()
        .mockResolvedValue({ id: "user_new", email: "applicant@example.com", name: "Jane Smith" }),
    },
    partner: {
      create: vi
        .fn()
        .mockResolvedValue({ id: "partner_new" }),
    },
    tier: {
      findFirst: vi.fn().mockResolvedValue(tier),
    },
    auditLog: {
      create: vi.fn().mockResolvedValue({}),
    },
  };
}

// ---------------------------------------------------------------------------
// sendAgreementPacket
// ---------------------------------------------------------------------------

describe("sendAgreementPacket", () => {
  it("creates a new Agreement record when none exists", async () => {
    const db = makeFakeDb({ agreement: null });
    const emailAdapter = makeStubEmail();

    await sendAgreementPacket("app_1", adminActor, db, emailAdapter);

    expect(db.agreement.create).toHaveBeenCalledOnce();
    const call = vi.mocked(db.agreement.create).mock.calls[0][0];
    expect(call.data.status).toBe("SENT");
    expect(call.data.applicationId).toBe("app_1");
  });

  it("updates existing agreement on resend instead of creating a new one", async () => {
    const db = makeFakeDb({ agreement: makeAgreement({ status: "SENT" }) });
    const emailAdapter = makeStubEmail();

    await sendAgreementPacket("app_1", adminActor, db, emailAdapter);

    expect(db.agreement.create).not.toHaveBeenCalled();
    expect(db.agreement.update).toHaveBeenCalledOnce();
  });

  it("sends an email after DB writes", async () => {
    const db = makeFakeDb({ agreement: null });
    const emailAdapter = makeStubEmail();

    await sendAgreementPacket("app_1", adminActor, db, emailAdapter);

    expect(emailAdapter.send).toHaveBeenCalledOnce();
    const call = vi.mocked(emailAdapter.send).mock.calls[0][0];
    expect(call.to).toBe("applicant@example.com");
  });

  it("marks EmailLog SENT on success", async () => {
    const db = makeFakeDb({ agreement: null });
    await sendAgreementPacket("app_1", adminActor, db, makeStubEmail());

    const updateCall = vi.mocked(db.emailLog.update).mock.calls[0][0];
    expect(updateCall.data.status).toBe("SENT");
    expect(updateCall.data.providerId).toBe("email_test_1");
  });

  it("marks EmailLog FAILED when email send fails", async () => {
    const db = makeFakeDb({ agreement: null });
    const failingEmail = makeStubEmail({
      send: vi.fn().mockResolvedValue({ error: "SMTP timeout" }),
    });

    await sendAgreementPacket("app_1", adminActor, db, failingEmail);

    const updateCall = vi.mocked(db.emailLog.update).mock.calls[0][0];
    expect(updateCall.data.status).toBe("FAILED");
    expect(updateCall.data.error).toBe("SMTP timeout");
  });

  it("creates a Notification record", async () => {
    const db = makeFakeDb({ agreement: null });
    await sendAgreementPacket("app_1", adminActor, db, makeStubEmail());

    expect(db.notification.create).toHaveBeenCalledOnce();
  });

  it("updates application status to AGREEMENT_SENT", async () => {
    const db = makeFakeDb({ agreement: null });
    await sendAgreementPacket("app_1", adminActor, db, makeStubEmail());

    const call = vi.mocked(db.partnerApplication.update).mock.calls[0][0];
    expect(call.data.status).toBe("AGREEMENT_SENT");
  });

  it("writes an audit log", async () => {
    const db = makeFakeDb({ agreement: null });
    await sendAgreementPacket("app_1", adminActor, db, makeStubEmail());

    expect(db.auditLog.create).toHaveBeenCalledOnce();
    const call = vi.mocked(db.auditLog.create).mock.calls[0][0];
    expect(call.data.action).toBe("AGREEMENT_PACKET_SENT");
  });

  it("throws when actor is not admin", async () => {
    const db = makeFakeDb();
    await expect(
      sendAgreementPacket("app_1", partnerActor, db, makeStubEmail())
    ).rejects.toThrow(/admin access required/);
  });

  it("throws when application is not found", async () => {
    const db = makeFakeDb({ app: null });
    await expect(
      sendAgreementPacket("app_1", adminActor, db, makeStubEmail())
    ).rejects.toThrow("Application not found");
  });

  it("throws when application is not in APPROVED_PENDING_AGREEMENT status", async () => {
    const db = makeFakeDb({ app: makeApp({ status: "SUBMITTED" }) });
    await expect(
      sendAgreementPacket("app_1", adminActor, db, makeStubEmail())
    ).rejects.toThrow(/Cannot send agreement/);
  });
});

// ---------------------------------------------------------------------------
// markAgreementSigned
// ---------------------------------------------------------------------------

describe("markAgreementSigned", () => {
  it("transitions SENT -> SIGNED with a document URL", async () => {
    const db = makeFakeDb({ agreement: makeAgreement({ status: "SENT" }) });

    const result = await markAgreementSigned(
      "agr_1",
      { signedEvidenceUrl: "https://storage.example.com/signed.pdf" },
      adminActor,
      db
    );

    const call = vi.mocked(db.agreement.update).mock.calls[0][0];
    expect(call.data.status).toBe("SIGNED");
    expect(call.data.signedEvidenceUrl).toBe(
      "https://storage.example.com/signed.pdf"
    );
    expect(result.status).toBe("SIGNED");
  });

  it("transitions SENT -> SIGNED with a manual evidence note", async () => {
    const db = makeFakeDb({ agreement: makeAgreement({ status: "SENT" }) });

    await markAgreementSigned(
      "agr_1",
      { signedEvidenceNote: "Received via DocuSign on 2026-04-29" },
      adminActor,
      db
    );

    const call = vi.mocked(db.agreement.update).mock.calls[0][0];
    expect(call.data.signedEvidenceNote).toBe(
      "Received via DocuSign on 2026-04-29"
    );
  });

  it("writes an audit log on signing", async () => {
    const db = makeFakeDb({ agreement: makeAgreement({ status: "SENT" }) });
    await markAgreementSigned(
      "agr_1",
      { signedEvidenceNote: "Manual note" },
      adminActor,
      db
    );

    const call = vi.mocked(db.auditLog.create).mock.calls[0][0];
    expect(call.data.action).toBe("AGREEMENT_SIGNED");
    expect(call.data.before).toEqual({ status: "SENT" });
    expect(call.data.after).toEqual({ status: "SIGNED" });
  });

  it("throws when no evidence is provided", async () => {
    const db = makeFakeDb({ agreement: makeAgreement({ status: "SENT" }) });
    await expect(
      markAgreementSigned("agr_1", {}, adminActor, db)
    ).rejects.toThrow(/Signed document URL or manual evidence note is required/);
  });

  it("throws when agreement is not SENT", async () => {
    const db = makeFakeDb({ agreement: makeAgreement({ status: "DRAFT" }) });
    await expect(
      markAgreementSigned(
        "agr_1",
        { signedEvidenceNote: "Note" },
        adminActor,
        db
      )
    ).rejects.toThrow(/Cannot mark signed/);
  });

  it("throws when agreement is not found", async () => {
    const db = makeFakeDb({ agreement: null });
    vi.mocked(db.agreement.findFirst).mockResolvedValue(null);
    await expect(
      markAgreementSigned("missing", { signedEvidenceNote: "Note" }, adminActor, db)
    ).rejects.toThrow("Agreement not found");
  });

  it("throws when actor is not admin", async () => {
    const db = makeFakeDb({ agreement: makeAgreement({ status: "SENT" }) });
    await expect(
      markAgreementSigned(
        "agr_1",
        { signedEvidenceNote: "Note" },
        partnerActor,
        db
      )
    ).rejects.toThrow(/admin access required/);
  });
});

// ---------------------------------------------------------------------------
// activatePartnerFromSignedAgreement
// ---------------------------------------------------------------------------

describe("activatePartnerFromSignedAgreement", () => {
  function makeSignedAgreement() {
    return makeAgreement({
      status: "SIGNED",
      signedEvidenceNote: "Received via email",
    });
  }

  it("creates a User and Partner record", async () => {
    const db = makeFakeDb({ agreement: makeSignedAgreement() });
    const result = await activatePartnerFromSignedAgreement(
      "agr_1",
      adminActor,
      db,
      makeStubEmail()
    );

    expect(db.user.create).toHaveBeenCalledOnce();
    expect(db.partner.create).toHaveBeenCalledOnce();
    expect(result.userId).toBe("user_new");
    expect(result.partnerId).toBe("partner_new");
  });

  it("creates Partner with ACTIVE status linked to default tier", async () => {
    const db = makeFakeDb({ agreement: makeSignedAgreement() });
    await activatePartnerFromSignedAgreement("agr_1", adminActor, db, makeStubEmail());

    const partnerCall = vi.mocked(db.partner.create).mock.calls[0][0];
    expect(partnerCall.data.status).toBe("ACTIVE");
    expect(partnerCall.data.tierId).toBe("tier_1");
  });

  it("creates User with PARTNER role and ACTIVE status", async () => {
    const db = makeFakeDb({ agreement: makeSignedAgreement() });
    await activatePartnerFromSignedAgreement("agr_1", adminActor, db, makeStubEmail());

    const userCall = vi.mocked(db.user.create).mock.calls[0][0];
    expect(userCall.data.role).toBe("PARTNER");
    expect(userCall.data.status).toBe("ACTIVE");
    expect(userCall.data.email).toBe("applicant@example.com");
  });

  it("updates application status to ACTIVATED", async () => {
    const db = makeFakeDb({ agreement: makeSignedAgreement() });
    await activatePartnerFromSignedAgreement("agr_1", adminActor, db, makeStubEmail());

    const appCall = vi.mocked(db.partnerApplication.update).mock.calls[0][0];
    expect(appCall.data.status).toBe("ACTIVATED");
  });

  it("sends a partner activation email", async () => {
    const db = makeFakeDb({ agreement: makeSignedAgreement() });
    const emailAdapter = makeStubEmail();
    await activatePartnerFromSignedAgreement("agr_1", adminActor, db, emailAdapter);

    expect(emailAdapter.send).toHaveBeenCalledOnce();
    const call = vi.mocked(emailAdapter.send).mock.calls[0][0];
    expect(call.to).toBe("applicant@example.com");
  });

  it("writes a PARTNER_ACTIVATED audit log", async () => {
    const db = makeFakeDb({ agreement: makeSignedAgreement() });
    await activatePartnerFromSignedAgreement("agr_1", adminActor, db, makeStubEmail());

    const call = vi.mocked(db.auditLog.create).mock.calls[0][0];
    expect(call.data.action).toBe("PARTNER_ACTIVATED");
  });

  it("hard-guards against unsigned agreements", async () => {
    const db = makeFakeDb({ agreement: makeAgreement({ status: "SENT" }) });
    await expect(
      activatePartnerFromSignedAgreement("agr_1", adminActor, db, makeStubEmail())
    ).rejects.toThrow(/agreement status is SENT/);
    expect(db.user.create).not.toHaveBeenCalled();
  });

  it("hard-guards when agreement is SIGNED but has no evidence", async () => {
    const db = makeFakeDb({
      agreement: makeAgreement({
        status: "SIGNED",
        signedEvidenceUrl: null,
        signedEvidenceNote: null,
      }),
    });
    await expect(
      activatePartnerFromSignedAgreement("agr_1", adminActor, db, makeStubEmail())
    ).rejects.toThrow(/no signed evidence/);
    expect(db.user.create).not.toHaveBeenCalled();
  });

  it("throws when no default tier is found", async () => {
    const db = makeFakeDb({ agreement: makeSignedAgreement(), tier: null });
    await expect(
      activatePartnerFromSignedAgreement("agr_1", adminActor, db, makeStubEmail())
    ).rejects.toThrow(/No default tier/);
  });

  it("throws when actor is not admin", async () => {
    const db = makeFakeDb({ agreement: makeSignedAgreement() });
    await expect(
      activatePartnerFromSignedAgreement("agr_1", partnerActor, db, makeStubEmail())
    ).rejects.toThrow(/admin access required/);
  });

  it("still logs EmailLog FAILED when activation email fails", async () => {
    const db = makeFakeDb({ agreement: makeSignedAgreement() });
    const failingEmail = makeStubEmail({
      send: vi.fn().mockResolvedValue({ error: "SMTP error" }),
    });

    await activatePartnerFromSignedAgreement("agr_1", adminActor, db, failingEmail);

    const updateCall = vi.mocked(db.emailLog.update).mock.calls[0][0];
    expect(updateCall.data.status).toBe("FAILED");
  });
});
