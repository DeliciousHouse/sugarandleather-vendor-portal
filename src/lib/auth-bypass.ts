import type { SessionUser } from "./access-control";

type AuthBypassEnv = NodeJS.ProcessEnv | {
  NODE_ENV?: string | undefined;
  DISABLE_PORTAL_AUTH?: string | undefined;
  DISABLE_PORTAL_AUTH_ADMIN_USER_ID?: string | undefined;
  DISABLE_PORTAL_AUTH_PARTNER_USER_ID?: string | undefined;
  DISABLE_PORTAL_AUTH_PARTNER_ID?: string | undefined;
};

const DEFAULT_ADMIN_USER_ID = "local-demo-admin";
const DEFAULT_PARTNER_USER_ID = "local-demo-partner-user";
const DEFAULT_PARTNER_ID = "local-demo-partner";

let warnedOnceInProd = false;

/**
 * Returns `true` only when:
 *  - `DISABLE_PORTAL_AUTH=true`, AND
 *  - `NODE_ENV` is NOT `"production"`.
 *
 * In production, the flag is hard-ignored — no env-misconfiguration in a deploy
 * can disable portal auth. Logs a one-shot warning if anyone sets the flag in
 * a production environment so the misconfiguration is visible.
 */
export function isPortalAuthDisabled(env: AuthBypassEnv = process.env): boolean {
  const flag = env.DISABLE_PORTAL_AUTH === "true";
  if (!flag) return false;
  const isProd = env.NODE_ENV === "production";
  if (isProd) {
    if (!warnedOnceInProd) {
      warnedOnceInProd = true;
      console.error(
        "[auth-bypass] DISABLE_PORTAL_AUTH=true was set in a production environment. The flag is being IGNORED. Remove it from the environment.",
      );
    }
    return false;
  }
  return true;
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
