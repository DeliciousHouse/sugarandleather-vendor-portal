// Commission rule types and pure calculation functions.
// These are used to calculate amounts from rule snapshots at deal close time.

export type CommissionRuleSnapshot = {
  id: string;
  tierId: string;
  tierName: string;
  productCode: string;
  packageCode: string | null;
  kind: "UPFRONT" | "TRAILING";
  percentBps: number | null;
  flatAmountCents: number | null;
  currency: string;
  trailingMonths: number | null;
  payoutDelayDays: number;
};

export type TrailingPeriod = {
  periodStart: Date;
  periodEnd: Date;
};

/**
 * Calculates commission amount in cents from a rule snapshot and revenue.
 * Percentage rules use basis points (100 bps = 1%). Flat rules return the
 * fixed amount regardless of revenue.
 */
export function calculateUpfrontAmount(
  rule: Pick<
    CommissionRuleSnapshot,
    "percentBps" | "flatAmountCents"
  >,
  revenueCents: number
): number {
  if (rule.percentBps !== null) {
    return Math.round((revenueCents * rule.percentBps) / 10000);
  }
  if (rule.flatAmountCents !== null) {
    return rule.flatAmountCents;
  }
  throw new Error(
    "Commission rule must have either percentBps or flatAmountCents"
  );
}

/**
 * Builds monthly trailing periods starting the month after closedAt.
 * Each period covers the first through the last day of a calendar month.
 */
export function buildTrailingPeriods(
  closedAt: Date,
  trailingMonths: number
): TrailingPeriod[] {
  const periods: TrailingPeriod[] = [];
  for (let i = 0; i < trailingMonths; i++) {
    // Month offset: first period is next month (i+1), second is i+2, etc.
    const targetMonth = closedAt.getMonth() + i + 1;
    const targetYear = closedAt.getFullYear();
    // new Date(year, month, 1) handles month overflow correctly (JS normalizes)
    const periodStart = new Date(targetYear, targetMonth, 1);
    // Last day of targetMonth: day 0 of the following month
    const periodEnd = new Date(targetYear, targetMonth + 1, 0);
    periods.push({ periodStart, periodEnd });
  }
  return periods;
}

/**
 * Adds payoutDelayDays to a base date and returns the resulting Date.
 */
export function addPayoutDelay(baseDate: Date, payoutDelayDays: number): Date {
  const result = new Date(baseDate);
  result.setDate(result.getDate() + payoutDelayDays);
  return result;
}
