import { NextRequest, NextResponse } from "next/server";

import { SESSION_COOKIE_NAME, verifySessionToken } from "./lib/session";

const AUTH_SECRET = process.env.AUTH_SECRET ?? "development-secret-change-me-at-least-32-chars";

function loginRedirect(request: NextRequest, reason?: string) {
  const url = request.nextUrl.clone();
  const loginUrl = new URL("/login", url.origin);
  loginUrl.searchParams.set("next", `${url.pathname}${url.search}`);
  if (reason) loginUrl.searchParams.set("reason", reason);
  return NextResponse.redirect(loginUrl);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = await verifySessionToken(token, AUTH_SECRET);

  if (!user) {
    return loginRedirect(request);
  }

  if (pathname.startsWith("/admin")) {
    if (user.role !== "ADMIN") {
      return loginRedirect(request, "admin_required");
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/partner/pending")) {
    if (user.role !== "PARTNER") {
      return loginRedirect(request, "partner_required");
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/partner")) {
    if (user.role !== "PARTNER") {
      return loginRedirect(request, "partner_required");
    }
    if (user.status !== "ACTIVE") {
      const pendingUrl = request.nextUrl.clone();
      pendingUrl.pathname = "/partner/pending";
      pendingUrl.search = "";
      return NextResponse.redirect(pendingUrl);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/partner/:path*"],
};
