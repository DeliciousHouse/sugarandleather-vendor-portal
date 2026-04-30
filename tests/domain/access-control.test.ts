import { describe, it, expect } from "vitest";
import {
  requireAdmin,
  requirePartner,
  requireActivePartner,
  assertOwnership,
  type SessionUser,
} from "../../src/lib/access-control";

const adminUser: SessionUser = {
  id: "admin-1",
  role: "ADMIN",
  status: "ACTIVE",
};

const partnerUser: SessionUser = {
  id: "partner-1",
  role: "PARTNER",
  status: "ACTIVE",
  partnerId: "partner-org-1",
};

const invitedPartner: SessionUser = {
  id: "partner-2",
  role: "PARTNER",
  status: "INVITED",
  partnerId: "partner-org-2",
};

const suspendedPartner: SessionUser = {
  id: "partner-3",
  role: "PARTNER",
  status: "SUSPENDED",
  partnerId: "partner-org-3",
};

describe("requireAdmin", () => {
  it("throws if user is null", () => {
    expect(() => requireAdmin(null)).toThrow("Unauthorized: not authenticated");
  });

  it("throws if user is PARTNER", () => {
    expect(() => requireAdmin(partnerUser)).toThrow(
      "Forbidden: admin access required"
    );
  });

  it("returns user if ADMIN", () => {
    expect(requireAdmin(adminUser)).toBe(adminUser);
  });
});

describe("requirePartner", () => {
  it("throws if user is null", () => {
    expect(() => requirePartner(null)).toThrow("Unauthorized: not authenticated");
  });

  it("throws if user is ADMIN", () => {
    expect(() => requirePartner(adminUser)).toThrow(
      "Forbidden: partner access required"
    );
  });

  it("returns user if PARTNER (any status)", () => {
    expect(requirePartner(partnerUser)).toBe(partnerUser);
    expect(requirePartner(invitedPartner)).toBe(invitedPartner);
    expect(requirePartner(suspendedPartner)).toBe(suspendedPartner);
  });
});

describe("requireActivePartner", () => {
  it("throws if user is null", () => {
    expect(() => requireActivePartner(null)).toThrow(
      "Unauthorized: not authenticated"
    );
  });

  it("throws if user is ADMIN", () => {
    expect(() => requireActivePartner(adminUser)).toThrow(
      "Forbidden: partner access required"
    );
  });

  it("throws if PARTNER with status INVITED", () => {
    expect(() => requireActivePartner(invitedPartner)).toThrow(
      "Forbidden: active partner access required"
    );
  });

  it("throws if PARTNER with status SUSPENDED", () => {
    expect(() => requireActivePartner(suspendedPartner)).toThrow(
      "Forbidden: active partner access required"
    );
  });

  it("returns user if PARTNER with status ACTIVE", () => {
    expect(requireActivePartner(partnerUser)).toBe(partnerUser);
  });
});

describe("assertOwnership", () => {
  it("ADMIN can access any partner's resource", () => {
    expect(() => assertOwnership(adminUser, "any-partner-id")).not.toThrow();
    expect(() => assertOwnership(adminUser, "partner-org-1")).not.toThrow();
  });

  it("PARTNER can access their own resource", () => {
    expect(() =>
      assertOwnership(partnerUser, "partner-org-1")
    ).not.toThrow();
  });

  it("PARTNER cannot access another partner's resource", () => {
    expect(() =>
      assertOwnership(partnerUser, "partner-org-2")
    ).toThrow("Forbidden: cannot access another partner's resource");
  });
});
