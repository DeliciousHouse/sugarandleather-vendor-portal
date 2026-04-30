import type { SessionUser } from "./access-control";

type AuthBypassEnv = NodeJS.ProcessEnv | {
  DISABLE_PORTAL_AUTH?: string | undefined;
  DISABLE_PORTAL_AUTH_ADMIN_USER_ID?: string | undefined;
  DISABLE_PORTAL_AUTH_PARTNER_USER_ID?: string | undefined;
  DISABLE_PORTAL_AUTH_PARTNER_ID?: string | undefined;
};

const DEFAULT_ADMIN_USER_ID = "local-demo-admin";
const DEFAULT_PARTNER_USER_ID = "local-demo-partner-user";
const DEFAULT_PARTNER_ID = "local-demo-partner";

export function isPortalAuthDisabled(env: AuthBypassEnv = process.env): boolean {
  return env.DISABLE_PORTAL_AUTH === "true";
}

export function getBypassAdminUser(env: AuthBypassEnv = process.env): SessionUser {
  return {
    id: env.DISABLE_PORTAL_AUTH_ADMIN_USER_ID || DEFAULT_ADMIN_USER_ID,
    role: "ADMIN",
    status: "ACTIVE",
  };
}

export function getBypassPartnerUser(env: AuthBypassEnv = process.env): SessionUser {
  return {
    id: env.DISABLE_PORTAL_AUTH_PARTNER_USER_ID || DEFAULT_PARTNER_USER_ID,
    role: "PARTNER",
    status: "ACTIVE",
    partnerId: env.DISABLE_PORTAL_AUTH_PARTNER_ID || DEFAULT_PARTNER_ID,
  };
}
