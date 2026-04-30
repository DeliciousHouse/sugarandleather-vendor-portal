// Sugar & Leather Vendor Portal — Audit logging utilities

export type Actor = { id: string; type: "USER" } | { type: "SYSTEM" };

export type AuditPayload = {
  actorId?: string;
  actorType: "USER" | "SYSTEM";
  action: string;
  entityType: string;
  entityId: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  reason?: string;
};

export type AuditClient = {
  auditLog: {
    create: (args: { data: AuditPayload }) => Promise<unknown>;
  };
};

/**
 * Pure function — no DB calls. Builds an AuditPayload from an actor and event
 * details. Safe to call in any context; nothing is written to the DB.
 */
export function buildAuditPayload(
  actor: Actor,
  action: string,
  entityType: string,
  entityId: string,
  opts?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
    reason?: string;
  }
): AuditPayload {
  const base: AuditPayload = {
    actorType: actor.type,
    action,
    entityType,
    entityId,
  };

  if (actor.type === "USER") {
    base.actorId = actor.id;
  }

  if (opts?.before !== undefined) {
    base.before = opts.before;
  }
  if (opts?.after !== undefined) {
    base.after = opts.after;
  }
  if (opts?.reason !== undefined) {
    base.reason = opts.reason;
  }

  return base;
}

/**
 * Writes an audit log entry via the injected client. Required audit writes fail
 * closed by default so legal/financial state changes cannot silently continue
 * without an audit trail.
 */
export async function writeAuditLog(
  client: AuditClient,
  payload: AuditPayload
): Promise<void> {
  await client.auditLog.create({ data: payload });
}

/**
 * Convenience factory. Returns a single function that builds a payload and
 * writes it in one call. This is the primary entry point for callers.
 *
 * @example
 *   const audit = createAuditWriter(prisma);
 *   await audit(actor, "PARTNER_APPROVED", "Partner", partner.id, { after: { status: "ACTIVE" } });
 */
export function createAuditWriter(client: AuditClient) {
  return (
    actor: Actor,
    action: string,
    entityType: string,
    entityId: string,
    opts?: {
      before?: Record<string, unknown>;
      after?: Record<string, unknown>;
      reason?: string;
    }
  ): Promise<void> => {
    const payload = buildAuditPayload(actor, action, entityType, entityId, opts);
    return writeAuditLog(client, payload);
  };
}

export default createAuditWriter;
