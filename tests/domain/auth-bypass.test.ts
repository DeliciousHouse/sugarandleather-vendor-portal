import { describe, expect, it, vi } from "vitest";

import {
  getBypassAdminUser,
  getBypassPartnerUser,
  isPortalAuthDisabled,
} from "@/lib/auth-bypass";

describe("local portal auth bypass", () => {
  it("is disabled unless DISABLE_PORTAL_AUTH is exactly true", () => {
    expect(isPortalAuthDisabled({})).toBe(false);
    expect(isPortalAuthDisabled({ DISABLE_PORTAL_AUTH: "false" })).toBe(false);
    expect(isPortalAuthDisabled({ DISABLE_PORTAL_AUTH: "TRUE" })).toBe(false);
    expect(isPortalAuthDisabled({ DISABLE_PORTAL_AUTH: "true" })).toBe(true);
  });

  it("hard-ignores DISABLE_PORTAL_AUTH=true when NODE_ENV=production", () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(
      isPortalAuthDisabled({
        DISABLE_PORTAL_AUTH: "true",
        NODE_ENV: "production",
      }),
    ).toBe(false);
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it("allows the bypass in non-production environments", () => {
    expect(
      isPortalAuthDisabled({
        DISABLE_PORTAL_AUTH: "true",
        NODE_ENV: "development",
      }),
    ).toBe(true);
    expect(
      isPortalAuthDisabled({
        DISABLE_PORTAL_AUTH: "true",
        NODE_ENV: "test",
      }),
    ).toBe(true);
  });

  it("provides separate admin and partner demo sessions", () => {
    expect(getBypassAdminUser()).toEqual({
      id: "local-demo-admin",
      role: "ADMIN",
      status: "ACTIVE",
    });

    expect(getBypassPartnerUser()).toEqual({
      id: "local-demo-partner-user",
      role: "PARTNER",
      status: "ACTIVE",
      partnerId: "local-demo-partner",
    });
  });

  it("lets demo ids be overridden from env", () => {
    expect(
      getBypassPartnerUser({
        DISABLE_PORTAL_AUTH_PARTNER_USER_ID: "user_custom",
        DISABLE_PORTAL_AUTH_PARTNER_ID: "partner_custom",
      })
    ).toMatchObject({ id: "user_custom", partnerId: "partner_custom" });
  });
});
