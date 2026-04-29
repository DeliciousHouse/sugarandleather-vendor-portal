export type SessionUser = {
  id: string;
  role: "ADMIN" | "PARTNER";
  status: "INVITED" | "ACTIVE" | "SUSPENDED" | "DISABLED";
  partnerId?: string;
};

export function requireAdmin(user: SessionUser | null | undefined): SessionUser {
  if (user == null) {
    throw new Error("Unauthorized: not authenticated");
  }
  if (user.role !== "ADMIN") {
    throw new Error("Forbidden: admin access required");
  }
  return user;
}

export function requirePartner(user: SessionUser | null | undefined): SessionUser {
  if (user == null) {
    throw new Error("Unauthorized: not authenticated");
  }
  if (user.role !== "PARTNER") {
    throw new Error("Forbidden: partner access required");
  }
  return user;
}

export function requireActivePartner(user: SessionUser | null | undefined): SessionUser {
  const partner = requirePartner(user);
  if (partner.status !== "ACTIVE") {
    throw new Error("Forbidden: active partner access required");
  }
  return partner;
}

export function assertOwnership(user: SessionUser, resourcePartnerId: string): void {
  if (user.role === "ADMIN") {
    return;
  }
  if (user.partnerId !== resourcePartnerId) {
    throw new Error("Forbidden: cannot access another partner's resource");
  }
}
