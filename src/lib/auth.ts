import { cookies } from "next/headers";

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
  return requireAdmin(await getCurrentUser());
}

export async function getRequiredPartner(): Promise<SessionUser> {
  return requirePartner(await getCurrentUser());
}

export async function getRequiredActivePartner(): Promise<SessionUser> {
  return requireActivePartner(await getCurrentUser());
}
