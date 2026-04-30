/**
 * E2E database helper: creates and cleans up test data using raw pg SQL.
 * pg is a CJS module and avoids the ESM/CJS conflict that the Prisma-generated
 * client has in Playwright's test runner (which compiles to CommonJS).
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Pool } = require("pg");

let _pool: ReturnType<typeof Pool> | null = null;

function pool() {
  if (!_pool) {
    _pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return _pool;
}

async function query(sql: string, params: unknown[] = []) {
  const result = await pool().query(sql, params);
  return result.rows;
}

function cuid(): string {
  // Simple CUID-ish unique ID for test records
  return "test_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ---------------------------------------------------------------------------
// Users and Partners
// ---------------------------------------------------------------------------

export async function createTestAdmin(email: string) {
  const id = cuid();
  await query(
    `INSERT INTO "User" (id, email, name, role, status, "createdAt", "updatedAt")
     VALUES ($1, $2, 'Test Admin', 'ADMIN', 'ACTIVE', NOW(), NOW())`,
    [id, email]
  );
  return { id, email };
}

export async function createTestPartnerUser(
  email: string,
  tierId: string,
  displayName = "Test Partner"
) {
  const userId = cuid();
  const partnerId = cuid();
  await query(
    `INSERT INTO "User" (id, email, name, role, status, "createdAt", "updatedAt")
     VALUES ($1, $2, $3, 'PARTNER', 'ACTIVE', NOW(), NOW())`,
    [userId, email, displayName]
  );
  await query(
    `INSERT INTO "Partner" (id, "userId", "tierId", status, "displayName", "activatedAt", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, 'ACTIVE', $4, NOW(), NOW(), NOW())`,
    [partnerId, userId, tierId, displayName]
  );
  return { user: { id: userId, email }, partner: { id: partnerId, userId, tierId } };
}

// ---------------------------------------------------------------------------
// Tiers and commission rules
// ---------------------------------------------------------------------------

export async function getOrCreateDefaultTier() {
  const rows = await query(
    `SELECT id, name FROM "Tier" WHERE "isDefault" = true AND "isActive" = true LIMIT 1`
  );
  if (rows.length > 0) return rows[0] as { id: string; name: string };
  const id = cuid();
  await query(
    `INSERT INTO "Tier" (id, name, "isDefault", "isActive", "createdAt", "updatedAt")
     VALUES ($1, 'Affiliate', true, true, NOW(), NOW())`,
    [id]
  );
  return { id, name: "Affiliate" };
}

export async function createTestTier(name: string) {
  const id = cuid();
  await query(
    `INSERT INTO "Tier" (id, name, "isDefault", "isActive", "createdAt", "updatedAt")
     VALUES ($1, $2, false, true, NOW(), NOW())`,
    [id, name]
  );
  return { id, name };
}

/** Creates an UPFRONT commission rule with zero payout delay so tests can promote immediately. */
export async function createZeroDelayCommissionRule(tierId: string, productCode: string) {
  const id = cuid();
  await query(
    `INSERT INTO "CommissionRule" (id, "tierId", "productCode", kind, "percentBps", "payoutDelayDays", "clawbackWindowDays", "isActive", "startsAt", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, 'UPFRONT', 1000, 0, 90, true, NOW(), NOW(), NOW())`,
    [id, tierId, productCode]
  );
  return { id, tierId, productCode };
}

// ---------------------------------------------------------------------------
// Referrals and attribution
// ---------------------------------------------------------------------------

export async function createApprovedFirstAttributedReferral(
  partnerId: string,
  leadEmail: string
) {
  const lockId = cuid();
  const referralId = cuid();
  const key = `email:${leadEmail.toLowerCase().trim()}`;

  await query(
    `INSERT INTO "AttributionLock" (id, key, "partnerId", "lockedAt")
     VALUES ($1, $2, $3, NOW())`,
    [lockId, key, partnerId]
  );
  await query(
    `INSERT INTO "Referral" (id, "partnerId", "attributionLockId", status, "attributionStatus",
       "leadName", "leadEmail", "attributionKey", "originalPayload", "submittedAt", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, 'APPROVED', 'FIRST_ATTRIBUTED', 'E2E Test Lead', $4, $5, $6, NOW(), NOW(), NOW())`,
    [referralId, partnerId, lockId, leadEmail, key, JSON.stringify({ leadName: "E2E Test Lead", leadEmail })]
  );
  return { id: referralId, partnerId, attributionLockId: lockId };
}

// ---------------------------------------------------------------------------
// Deals
// ---------------------------------------------------------------------------

export async function createOpenDeal(
  referralId: string,
  partnerId: string,
  productCode: string,
  amountCents = 100_000
) {
  const id = cuid();
  await query(
    `INSERT INTO "Deal" (id, "referralId", "partnerId", "productCode", status, "amountCents", currency, "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, 'OPEN', $5, 'USD', NOW(), NOW())`,
    [id, referralId, partnerId, productCode, amountCents]
  );
  return { id, referralId, partnerId, productCode, amountCents };
}

// ---------------------------------------------------------------------------
// Cleanup helpers
// ---------------------------------------------------------------------------

export async function deleteUserAndDownstream(userId: string) {
  const partners = await query(`SELECT id FROM "Partner" WHERE "userId" = $1`, [userId]);
  for (const partner of partners) {
    const deals = await query(`SELECT id FROM "Deal" WHERE "partnerId" = $1`, [partner.id]);
    for (const deal of deals) {
      const events = await query(
        `SELECT id FROM "CommissionEvent" WHERE "dealId" = $1`,
        [deal.id]
      );
      const eventIds = events.map((e: { id: string }) => e.id);
      if (eventIds.length) {
        await query(
          `DELETE FROM "PayoutLine" WHERE "commissionEventId" = ANY($1::text[])`,
          [eventIds]
        );
        await query(`DELETE FROM "CommissionEvent" WHERE "dealId" = $1`, [deal.id]);
      }
    }
    await query(`DELETE FROM "Deal" WHERE "partnerId" = $1`, [partner.id]);

    const referrals = await query(
      `SELECT id, "attributionLockId" FROM "Referral" WHERE "partnerId" = $1`,
      [partner.id]
    );
    const lockIds = referrals
      .map((r: { attributionLockId: string | null }) => r.attributionLockId)
      .filter(Boolean);
    await query(`DELETE FROM "Referral" WHERE "partnerId" = $1`, [partner.id]);
    if (lockIds.length) {
      await query(`DELETE FROM "AttributionLock" WHERE id = ANY($1::text[])`, [lockIds]);
    }

    await query(`DELETE FROM "Partner" WHERE id = $1`, [partner.id]);
  }
  await query(`DELETE FROM "User" WHERE id = $1`, [userId]);
}

export async function deleteApplication(applicationId: string) {
  await query(`DELETE FROM "Agreement" WHERE "applicationId" = $1`, [applicationId]);
  await query(`DELETE FROM "PartnerApplication" WHERE id = $1`, [applicationId]);
}

export async function deleteActivatedPartnerByEmail(email: string) {
  const rows = await query(`SELECT id FROM "User" WHERE email = $1`, [email]);
  if (rows.length > 0) await deleteUserAndDownstream(rows[0].id);
}

export async function deletePayoutBatch(batchId: string) {
  await query(`DELETE FROM "PayoutLine" WHERE "payoutBatchId" = $1`, [batchId]);
  await query(`DELETE FROM "PayoutBatch" WHERE id = $1`, [batchId]);
}

export async function findUser(email: string) {
  const rows = await query(`SELECT id, email, role, status FROM "User" WHERE email = $1`, [email]);
  return rows[0] ?? null;
}

export async function findApplication(email: string) {
  const rows = await query(
    `SELECT id, status FROM "PartnerApplication" WHERE email = $1`,
    [email]
  );
  return rows[0] ?? null;
}

export async function findPartnerByApplicationId(applicationId: string) {
  const rows = await query(
    `SELECT id, status FROM "Partner" WHERE "applicationId" = $1`,
    [applicationId]
  );
  return rows[0] ?? null;
}

export async function findAgreement(applicationId: string) {
  const rows = await query(
    `SELECT id, status FROM "Agreement" WHERE "applicationId" = $1 LIMIT 1`,
    [applicationId]
  );
  return rows[0] ?? null;
}

export async function findReferral(partnerId: string, leadEmail: string) {
  const rows = await query(
    `SELECT id, status, "attributionStatus" FROM "Referral" WHERE "partnerId" = $1 AND "leadEmail" = $2`,
    [partnerId, leadEmail]
  );
  return rows[0] ?? null;
}

export async function createPendingDuplicateReferral(
  partnerId: string,
  leadEmail: string,
  leadName = "Acme Corp Decision Maker"
) {
  const lock = await findAttributionLock(leadEmail);
  if (!lock) throw new Error(`Attribution lock not found for ${leadEmail}`);
  const referralId = cuid();
  const key = `email:${leadEmail.toLowerCase().trim()}`;
  await query(
    `INSERT INTO "Referral" (id, "partnerId", "attributionLockId", status, "attributionStatus",
       "leadName", "leadEmail", "leadCompany", "attributionKey", "originalPayload", "submittedAt", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, 'PENDING_REVIEW', 'DUPLICATE_NO_CREDIT', $4, $5, 'Acme Corp', $6, $7, NOW(), NOW(), NOW())`,
    [
      referralId,
      partnerId,
      lock.id,
      leadName,
      leadEmail,
      key,
      JSON.stringify({ leadName, leadEmail, leadCompany: "Acme Corp" }),
    ]
  );
  return { id: referralId, partnerId, attributionLockId: lock.id };
}

export async function findAttributionLock(leadEmail: string) {
  const key = `email:${leadEmail.toLowerCase()}`;
  const rows = await query(
    `SELECT id, "partnerId" FROM "AttributionLock" WHERE key = $1`,
    [key]
  );
  return rows[0] ?? null;
}

export async function findCommissionEvents(dealId: string) {
  return query(
    `SELECT id, kind, status, "amountCents", "clawbackOfEventId" FROM "CommissionEvent" WHERE "dealId" = $1`,
    [dealId]
  );
}

export async function createClawbackForCommissionEvent(eventId: string, reason: string) {
  const original = await findCommissionEvent(eventId);
  if (!original) throw new Error(`Commission event not found: ${eventId}`);
  const id = cuid();
  const [fullOriginal] = await query(
    `SELECT * FROM "CommissionEvent" WHERE id = $1`,
    [eventId]
  );
  await query(
    `INSERT INTO "CommissionEvent" (id, "partnerId", "dealId", "ruleId", kind, status, "amountCents", currency,
       "sourceRevenueCents", "percentBpsSnapshot", "flatAmountCentsSnapshot", "tierNameSnapshot",
       "productCodeSnapshot", "packageCodeSnapshot", "periodStart", "periodEnd", "payoutEligibleAt",
       "clawbackOfEventId", reason, "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, 'CLAWBACK', 'CLAWED_BACK', $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), $15, $16, NOW(), NOW())`,
    [
      id,
      fullOriginal.partnerId,
      fullOriginal.dealId,
      fullOriginal.ruleId,
      -Math.abs(fullOriginal.amountCents),
      fullOriginal.currency,
      fullOriginal.sourceRevenueCents,
      fullOriginal.percentBpsSnapshot,
      fullOriginal.flatAmountCentsSnapshot,
      fullOriginal.tierNameSnapshot,
      fullOriginal.productCodeSnapshot,
      fullOriginal.packageCodeSnapshot,
      fullOriginal.periodStart,
      fullOriginal.periodEnd,
      eventId,
      reason,
    ]
  );
  await query(`UPDATE "CommissionEvent" SET status = 'CLAWED_BACK', "updatedAt" = NOW() WHERE id = $1`, [eventId]);
  return { id };
}

export async function findDeal(dealId: string) {
  const rows = await query(`SELECT id, status FROM "Deal" WHERE id = $1`, [dealId]);
  return rows[0] ?? null;
}

export async function findPayoutBatch(batchId: string) {
  const rows = await query(`SELECT id, status FROM "PayoutBatch" WHERE id = $1`, [batchId]);
  return rows[0] ?? null;
}

export async function findCommissionEvent(id: string) {
  const rows = await query(
    `SELECT id, kind, status, "amountCents", "clawbackOfEventId" FROM "CommissionEvent" WHERE id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function deleteTestTierByName(name: string) {
  const rows = await query(`SELECT id FROM "Tier" WHERE name = $1`, [name]);
  if (rows.length > 0) {
    const tierId = rows[0].id;
    await query(`DELETE FROM "CommissionRule" WHERE "tierId" = $1`, [tierId]);
    await query(`DELETE FROM "Tier" WHERE id = $1`, [tierId]);
  }
}
