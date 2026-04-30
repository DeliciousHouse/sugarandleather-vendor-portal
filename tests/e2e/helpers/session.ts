/**
 * E2E session helper: creates real HMAC-signed session cookies for test users.
 * Uses the same createSessionToken from src/lib/session, so cookies are accepted
 * by the running dev server without any special test-only bypass.
 */
import type { BrowserContext } from "@playwright/test";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/session";
import type { SessionUser } from "@/lib/access-control";

const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:3100";

export async function setSessionCookie(context: BrowserContext, user: SessionUser): Promise<void> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "AUTH_SECRET is not set. Make sure .env.local is present before running E2E tests."
    );
  }
  const token = await createSessionToken(user, secret);
  await context.addCookies([
    {
      name: SESSION_COOKIE_NAME,
      value: token,
      domain: new URL(BASE_URL).hostname,
      path: "/",
      httpOnly: true,
    },
  ]);
}

export async function setAdminSession(context: BrowserContext, userId: string): Promise<void> {
  return setSessionCookie(context, { id: userId, role: "ADMIN", status: "ACTIVE" });
}

export async function setPartnerSession(
  context: BrowserContext,
  userId: string,
  partnerId: string
): Promise<void> {
  return setSessionCookie(context, {
    id: userId,
    role: "PARTNER",
    status: "ACTIVE",
    partnerId,
  });
}
