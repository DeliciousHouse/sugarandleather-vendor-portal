import { buildAuditPayload, writeAuditLog, type Actor, type AuditClient } from "@/lib/audit";
import {
  calculateUpfrontAmount,
  buildTrailingPeriods,
  addPayoutDelay,
  type CommissionRuleSnapshot,
} from "./rules";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CommissionEventRow = {
  id: string;
  partnerId: string;
  dealId: string;
  ruleId: string | null;
  kind: string;
  status: string;
  amountCents: number;
  currency: string;
  sourceRevenueCents: number | null;
  percentBpsSnapshot: number | null;
  flatAmountCentsSnapshot: number | null;
  tierNameSnapshot: string;
  productCodeSnapshot: string;
  packageCodeSnapshot: string | null;
  periodStart: Date | null;
  periodEnd: Date | null;
  payoutEligibleAt: Date;
  paidAt: Date | null;
  clawbackOfEventId: string | null;
  reason: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type CommissionEventDb = {
  findFirst: (args: {
    where: {
      dealId: string;
      kind: string;
      periodStart?: Date | null;
    };
  }) => Promise<CommissionEventRow | null>;
  create: (args: { data: object }) => Promise<CommissionEventRow>;
};

export type CommissionDb = AuditClient & {
  commissionEvent: CommissionEventDb;
};

export type StageCommissionsInput = {
  dealId: string;
  partnerId: string;
  productCode: string;
  packageCode: string | null;
  amountCents: number;
  currency: string;
  closedAt: Date;
  rules: CommissionRuleSnapshot[];
};

export type CommissionServiceDeps = {
  db: CommissionDb;
  actor: Actor;
};

// ---------------------------------------------------------------------------
// stageCommissions
//
// Creates CommissionEvents from a set of snapshotted rules. Uses find-before-
// create for idempotency since the schema has an index but no unique constraint
// on (dealId, kind, periodStart). See schema follow-up note below.
//
// SCHEMA FOLLOW-UP: A unique constraint on CommissionEvent(dealId, kind,
// periodStart) would make idempotency DB-enforced rather than rely on
// find-before-create. Add @@unique([dealId, kind, periodStart]) to
// CommissionEvent when a migration window is available.
// ---------------------------------------------------------------------------

export async function stageCommissions(
  input: StageCommissionsInput,
  deps: CommissionServiceDeps
): Promise<CommissionEventRow[]> {
  const results: CommissionEventRow[] = [];

  for (const rule of input.rules) {
    if (rule.kind === "UPFRONT") {
      const event = await stageUpfront(input, rule, deps);
      results.push(event);
    } else if (rule.kind === "TRAILING") {
      const events = await stageTrailing(input, rule, deps);
      results.push(...events);
    }
  }

  return results;
}

async function stageUpfront(
  input: StageCommissionsInput,
  rule: CommissionRuleSnapshot,
  deps: CommissionServiceDeps
): Promise<CommissionEventRow> {
  // Idempotency: check for existing UPFRONT event for this deal
  const existing = await deps.db.commissionEvent.findFirst({
    where: { dealId: input.dealId, kind: "UPFRONT", periodStart: null },
  });
  if (existing) {
    return existing;
  }

  const amountCents = calculateUpfrontAmount(rule, input.amountCents);
  const payoutEligibleAt = addPayoutDelay(input.closedAt, rule.payoutDelayDays);

  const event = await deps.db.commissionEvent.create({
    data: {
      partnerId: input.partnerId,
      dealId: input.dealId,
      ruleId: rule.id,
      kind: "UPFRONT",
      status: "STAGED",
      amountCents,
      currency: rule.currency,
      sourceRevenueCents: input.amountCents,
      percentBpsSnapshot: rule.percentBps,
      flatAmountCentsSnapshot: rule.flatAmountCents,
      tierNameSnapshot: rule.tierName,
      productCodeSnapshot: rule.productCode,
      packageCodeSnapshot: rule.packageCode,
      periodStart: null,
      periodEnd: null,
      payoutEligibleAt,
    },
  });

  await writeAuditLog(
    deps.db,
    buildAuditPayload(
      deps.actor,
      "COMMISSION_STAGED",
      "CommissionEvent",
      event.id,
      {
        after: {
          kind: "UPFRONT",
          dealId: input.dealId,
          amountCents,
          tierNameSnapshot: rule.tierName,
        },
      }
    )
  );

  return event;
}

async function stageTrailing(
  input: StageCommissionsInput,
  rule: CommissionRuleSnapshot,
  deps: CommissionServiceDeps
): Promise<CommissionEventRow[]> {
  if (!rule.trailingMonths || rule.trailingMonths <= 0) {
    return [];
  }

  const periods = buildTrailingPeriods(input.closedAt, rule.trailingMonths);
  const amountCents = calculateUpfrontAmount(rule, input.amountCents);
  const results: CommissionEventRow[] = [];

  for (const period of periods) {
    // Idempotency: check for existing TRAILING event for this deal+period
    const existing = await deps.db.commissionEvent.findFirst({
      where: {
        dealId: input.dealId,
        kind: "TRAILING",
        periodStart: period.periodStart,
      },
    });

    if (existing) {
      results.push(existing);
      continue;
    }

    const payoutEligibleAt = addPayoutDelay(period.periodEnd, rule.payoutDelayDays);

    const event = await deps.db.commissionEvent.create({
      data: {
        partnerId: input.partnerId,
        dealId: input.dealId,
        ruleId: rule.id,
        kind: "TRAILING",
        status: "STAGED",
        amountCents,
        currency: rule.currency,
        sourceRevenueCents: input.amountCents,
        percentBpsSnapshot: rule.percentBps,
        flatAmountCentsSnapshot: rule.flatAmountCents,
        tierNameSnapshot: rule.tierName,
        productCodeSnapshot: rule.productCode,
        packageCodeSnapshot: rule.packageCode,
        periodStart: period.periodStart,
        periodEnd: period.periodEnd,
        payoutEligibleAt,
      },
    });

    await writeAuditLog(
      deps.db,
      buildAuditPayload(
        deps.actor,
        "COMMISSION_STAGED",
        "CommissionEvent",
        event.id,
        {
          after: {
            kind: "TRAILING",
            dealId: input.dealId,
            amountCents,
            periodStart: period.periodStart,
            periodEnd: period.periodEnd,
          },
        }
      )
    );

    results.push(event);
  }

  return results;
}
