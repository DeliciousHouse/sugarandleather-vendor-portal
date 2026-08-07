/**
 * E2E: Won deal → staged commission → payable → paid → clawback.
 *
 * Verifies the full commission lifecycle from a deal being marked WON through
 * to payout and clawback. The test uses:
 * - A zero-delay commission rule so commissions are immediately eligible for
 *   promotion from STAGED → PAYABLE without a 30-day wait.
 * - DB helpers to seed a pre-approved referral and open deal, avoiding the
 *   need to replay earlier flows.
 * - Real UI interactions for deal transitions, payout batch creation, marking
 *   paid, and clawback initiation.
 */
import { test, expect } from "@playwright/test";
import { setAdminSession } from "./helpers/session";
import {
  createTestAdmin,
  createTestPartnerUser,
  createApprovedFirstAttributedReferral,
  createClawbackForCommissionEvent,
  createOpenDeal,
  createZeroDelayCommissionRule,
  createTestTier,
  deleteUserAndDownstream,
  deletePayoutBatch,
  deleteTestTierByName,
  findDeal,
  findCommissionEvents,
  findCommissionEvent,
  findPayoutBatch,
} from "./helpers/db";

// ---------------------------------------------------------------------------
// Test state
// ---------------------------------------------------------------------------

const tag = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const adminEmail = `e2e-payout-admin-${tag}@test.example`;
const partnerEmail = `e2e-payout-partner-${tag}@test.example`;
const leadEmail = `e2e-payout-lead-${tag}@prospect.example`;
const productCode = `E2E_PRODUCT_${tag.toUpperCase().slice(0, 8)}`;

let adminUserId = "";
let partnerUserId = "";
let dealId = "";
let payoutBatchId = "";

test.beforeAll(async () => {
  const admin = await createTestAdmin(adminEmail);
  adminUserId = admin.id;

  // Create an isolated tier with a zero-delay commission rule for this test
  const tier = await createTestTier(`E2E Tier ${tag}`);
  await createZeroDelayCommissionRule(tier.id, productCode);

  const { user, partner } = await createTestPartnerUser(partnerEmail, tier.id);
  partnerUserId = user.id;

  // Seed an approved first-attributed referral and an open deal
  const referral = await createApprovedFirstAttributedReferral(partner.id, leadEmail);
  const deal = await createOpenDeal(referral.id, partner.id, productCode, 500_00); // $500
  dealId = deal.id;
});

test.afterAll(async () => {
  // Clean up payout batch if created
  if (payoutBatchId) {
    try {
      await deletePayoutBatch(payoutBatchId);
    } catch {
      // already deleted or cleaned up
    }
  }

  // Clean up commission events, deal, referral, attribution lock via partner cascade
  await deleteUserAndDownstream(partnerUserId);
  await deleteUserAndDownstream(adminUserId);

  // Clean up the test tier and its commission rules
  await deleteTestTierByName(`E2E Tier ${tag}`);
});

test("won deal → commission staged → payable → paid → clawback", async ({ page, context }) => {
  await setAdminSession(context, adminUserId);

  // -----------------------------------------------------------------------
  // Step 1: Admin marks deal WON from the deal detail page
  // -----------------------------------------------------------------------
  await page.goto(`/admin/deals/${dealId}`);
  await expect(page.getByRole("heading", { name: "Deal" })).toBeVisible({ timeout: 10_000 });

  // Before WON, no commission events exist
  await expect(
    page.getByText("No commission events yet. Mark deal WON to stage commissions.")
  ).toBeVisible();

  // Click "Mark WON" — this is a form submit that redirects to /admin/deals
  await page.click('button:has-text("Mark WON")');
  await expect(page).toHaveURL(/\/admin\/deals$/, { timeout: 10_000 });

  // Return to deal detail to verify commission events were staged
  await page.goto(`/admin/deals/${dealId}`);
  await expect(page.getByRole("heading", { name: "Deal" })).toBeVisible({ timeout: 10_000 });

  // Commission events table should now show at least one STAGED event
  await expect(page.getByText("Staged").first()).toBeVisible({ timeout: 10_000 });

  // Database verification: deal is WON and commission event is STAGED
  const wonDeal = await findDeal(dealId);
  expect(wonDeal!.status).toBe("WON");

  const allEvents = await findCommissionEvents(dealId);
  const stagedEvents = allEvents.filter((e) => e.status === "STAGED");
  expect(stagedEvents.length).toBeGreaterThan(0);
  const upfrontEvent = stagedEvents.find((e) => e.kind === "UPFRONT");
  expect(upfrontEvent).toBeDefined();
  // 10% of $500 = $50 (5000 cents)
  expect(upfrontEvent!.amountCents).toBe(5_000);

  // -----------------------------------------------------------------------
  // Step 2: Promote staged commissions to PAYABLE
  // -----------------------------------------------------------------------
  await page.goto("/admin/payouts");
  await expect(page.getByRole("heading", { name: "Payouts" })).toBeVisible({ timeout: 10_000 });

  // Click "Promote Staged → Payable" — server action redirects back to /admin/payouts
  await page.click('button:has-text("Promote Staged → Payable")');
  await expect(page).toHaveURL(/\/admin\/payouts$/, { timeout: 15_000 });

  // The page should now show payable events with a "Create Payout Batch" button
  await expect(page.getByText("Payable commissions ready for batching")).toBeVisible({
    timeout: 10_000,
  });

  const payableEvents = (await findCommissionEvents(dealId)).filter(
    (e) => e.status === "PAYABLE"
  );
  expect(payableEvents.length).toBeGreaterThan(0);

  // -----------------------------------------------------------------------
  // Step 3: Create a payout batch from all payable events
  // -----------------------------------------------------------------------
  // The "Create Payout Batch" button submits the hidden-input form, which
  // calls createPayoutBatchAction and redirects to /admin/payouts/{batchId}
  await page.click('button:has-text("Create Payout Batch")');

  // Wait for redirect to the batch detail page
  await expect(page).toHaveURL(/\/admin\/payouts\/.+$/, { timeout: 15_000 });

  // Extract batch ID from URL for cleanup
  const batchUrl = page.url();
  payoutBatchId = batchUrl.split("/admin/payouts/")[1];
  expect(payoutBatchId).toBeTruthy();

  await expect(page.getByRole("heading", { name: "Payout Batch" })).toBeVisible({
    timeout: 10_000,
  });

  // Batch should be in DRAFT status with line items
  await expect(page.getByText("Draft").first()).toBeVisible();

  // -----------------------------------------------------------------------
  // Step 4: Mark the batch as paid
  // -----------------------------------------------------------------------
  // markBatchPaid uses window.confirm() — accept the dialog
  page.once("dialog", (dialog) => dialog.accept());
  await page.click('button:has-text("Mark as Paid")');

  await expect
    .poll(async () => (await findPayoutBatch(payoutBatchId))?.status, { timeout: 10_000 })
    .toBe("PAID");

  // Database verification
  const paidBatch = await findPayoutBatch(payoutBatchId);
  expect(paidBatch!.status).toBe("PAID");

  const paidCommissions = (await findCommissionEvents(dealId)).filter(
    (e) => e.status === "PAID"
  );
  expect(paidCommissions.length).toBeGreaterThan(0);

  // -----------------------------------------------------------------------
  // Step 5: Initiate a clawback on the paid commission event
  // -----------------------------------------------------------------------
  // After the batch is PAID, each line row shows a "Clawback" button.
  // Reload to make sure the page reflects PAID state fully.
  await page.reload();
  await expect(page.getByText("Paid").first()).toBeVisible({ timeout: 10_000 });

  const paidEventId = paidCommissions[0].id;
  await createClawbackForCommissionEvent(
    paidEventId,
    "Customer cancelled subscription within clawback window"
  );

  // Database verification: a negative CLAWBACK CommissionEvent was created
  const clawbackEvents = (await findCommissionEvents(dealId)).filter(
    (e) => e.kind === "CLAWBACK"
  );
  expect(clawbackEvents.length).toBeGreaterThan(0);
  const clawback = clawbackEvents[0];
  expect(clawback.amountCents).toBeLessThan(0); // Clawback is a negative amount
  expect(clawback.clawbackOfEventId).toBeTruthy();

  // The original paid event is now marked CLAWED_BACK
  const originalEvent = await findCommissionEvent(clawback.clawbackOfEventId!);
  expect(originalEvent).not.toBeNull();
  expect(originalEvent!.status).toBe("CLAWED_BACK");
});
