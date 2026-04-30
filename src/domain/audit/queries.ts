import { prisma } from "@/lib/prisma";
import type { AuditLogRow } from "@/components/audit/AuditLogTable";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyArgs = any;

type AuditDb = {
  auditLog: {
    findMany: (args: AnyArgs) => Promise<AuditLogRow[]>;
  };
};

export const AUDIT_ENTITY_TYPES = [
  "PartnerApplication",
  "Agreement",
  "Partner",
  "Referral",
  "Deal",
  "CommissionEvent",
  "PayoutBatch",
  "Tier",
];

export type GetAuditLogsOptions = {
  entityType?: string;
  actorId?: string;
  take?: number;
  skip?: number;
};

export async function getAuditLogs(
  db: AuditDb,
  opts?: GetAuditLogsOptions
): Promise<AuditLogRow[]> {
  const where: Record<string, unknown> = {};
  if (opts?.entityType) where.entityType = opts.entityType;
  if (opts?.actorId) where.actorId = opts.actorId;

  return db.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: opts?.take ?? 100,
    skip: opts?.skip ?? 0,
  });
}

export async function getAdminAuditLogs(opts?: GetAuditLogsOptions): Promise<AuditLogRow[]> {
  return getAuditLogs(prisma as unknown as AuditDb, opts);
}
