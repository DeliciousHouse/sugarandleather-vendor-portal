import { cookies } from "next/headers";

import { getBypassAdminUser, getBypassPartnerUser, isPortalAuthDisabled } from "./auth-bypass";
import { requireActivePartner, requireAdmin, requirePartner, type SessionUser } from "./access-control";
import { getEnv } from "./env";
import { SESSION_COOKIE_NAME, verifySessionToken } from "./session";

export { requireActivePartner, requireAdmin, requirePartner, SESSION_COOKIE_NAME };
export type { SessionUser };

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(token, getEnv().AUTH_SECRET);
}

export async function getRequiredAdmin(): Promise<SessionUser> {
  if (isPortalAuthDisabled()) {
    return getBypassAdminUser();
  }
  return requireAdmin(await getCurrentUser());
}

export async function getRequiredPartner(): Promise<SessionUser> {
  if (isPortalAuthDisabled()) {
    return getBypassPartnerUser();
  }
  return requirePartner(await getCurrentUser());
}

export async function getRequiredActivePartner(): Promise<SessionUser> {
  if (isPortalAuthDisabled()) {
    return getBypassPartnerUser();
  }
  return requireActivePartner(await getCurrentUser());
}
