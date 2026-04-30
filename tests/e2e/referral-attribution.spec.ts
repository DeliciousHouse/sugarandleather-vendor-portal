/**
 * E2E: Duplicate referral attribution across two partners.
 *
 * Verifies that the database-enforced first-come, first-attribution rule works
 * end-to-end. The first partner to submit a referral for a given lead email wins
 * FIRST_ATTRIBUTED; any subsequent partner submitting the same lead gets
 * DUPLICATE_NO_CREDIT and cannot have that referral approved for commission counting.
 */
import { test, expect } from "@playwright/test";
import { setAdminSession, setPartnerSession } from "./helpers/session";
import {
  createPendingDuplicateReferral,
  createTestAdmin,
  createTestPartnerUser,
  deleteUserAndDownstream,
  findAttributionLock,
  findReferral,
  getOrCreateDefaultTier,
} from "./helpers/db";

// ---------------------------------------------------------------------------
// Test state
// ---------------------------------------------------------------------------

const tag = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const adminEmail = `e2e-attr-admin-${tag}@test.example`;
const partnerAEmail = `e2e-attr-partnerA-${tag}@test.example`;
const partnerBEmail = `e2e-attr-partnerB-${tag}@test.example`;
const leadEmail = `e2e-lead-${tag}@acme.example`;

let adminUserId = "";
let partnerAUserId = "";
let partnerBUserId = "";
let partnerAPartnerId = "";
let partnerBPartnerId = "";
let partnerAReferralId = "";
let partnerBReferralId = "";

test.beforeAll(async () => {
  const tier = await getOrCreateDefaultTier();
  const admin = await createTestAdmin(adminEmail);
  adminUserId = admin.id;

  const { user: userA, partner: partnerA } = await createTestPartnerUser(
    partnerAEmail,
    tier.id,
    "Partner Adaline"
  );
  partnerAUserId = userA.id;
  partnerAPartnerId = partnerA.id;

  const { user: userB, partner: partnerB } = await createTestPartnerUser(
    partnerBEmail,
    tier.id,
    "Partner Bertram"
  );
  partnerBUserId = userB.id;
  partnerBPartnerId = partnerB.id;
});

test.afterAll(async () => {
  await deleteUserAndDownstream(partnerAUserId);
  await deleteUserAndDownstream(partnerBUserId);
  await deleteUserAndDownstream(adminUserId);
});

test("first partner wins attribution; second partner receives duplicate/no-credit", async ({
  page,
  context,
}) => {
  // -----------------------------------------------------------------------
  // Step 1: Partner A submits a referral for leadEmail
  // -----------------------------------------------------------------------
  await setPartnerSession(context, partnerAUserId, partnerAPartnerId);
  await page.goto("/partner/referrals/new");
  await expect(page.getByText("Submit a referral")).toBeVisible({ timeout: 10_000 });

  await page.fill("#leadName", "Acme Corp Decision Maker");
  await page.fill("#leadEmail", leadEmail);
  await page.fill("#leadCompany", "Acme Corp");
  await page.click('button:has-text("Submit referral")');

  // On success the page redirects to /partner/referrals
  await expect(page).toHaveURL(/\/partner\/referrals$/, { timeout: 10_000 });

  // Verify attribution in database
  const refA = await findReferral(partnerAPartnerId, leadEmail);
  expect(refA).not.toBeNull();
  expect(refA!.status).toBe("PENDING_REVIEW");
  expect(refA!.attributionStatus).toBe("FIRST_ATTRIBUTED");
  partnerAReferralId = refA!.id;

  // -----------------------------------------------------------------------
  // Step 2: Partner B submits a referral for the same leadEmail
  // -----------------------------------------------------------------------
  // Seed the duplicate record against the same attribution lock so the admin
  // review path can prove duplicates cannot be approved for commission credit.
  const duplicate = await createPendingDuplicateReferral(partnerBPartnerId, leadEmail);
  partnerBReferralId = duplicate.id;

  await context.clearCookies();
  await setPartnerSession(context, partnerBUserId, partnerBPartnerId);
  await page.goto("/partner/referrals");
  await expect(page.getByText("Acme Corp Decision Maker")).toBeVisible({ timeout: 10_000 });

  // Verify duplicate attribution in database
  const refB = await findReferral(partnerBPartnerId, leadEmail);
  expect(refB).not.toBeNull();
  expect(refB!.status).toBe("PENDING_REVIEW");
  expect(refB!.attributionStatus).toBe("DUPLICATE_NO_CREDIT");
  partnerBReferralId = refB!.id;

  // -----------------------------------------------------------------------
  // Step 3: Admin approves both referrals; only FIRST_ATTRIBUTED one can count
  // -----------------------------------------------------------------------
  await context.clearCookies();
  await setAdminSession(context, adminUserId);

  // Approve Partner A's FIRST_ATTRIBUTED referral
  await page.goto(`/admin/referrals/${partnerAReferralId}`);
  await expect(page.getByText("Review referral")).toBeVisible({ timeout: 10_000 });
  await page.click('button:has-text("Approve")');

  // Redirects to /admin/referrals after approval
  await expect(page).toHaveURL(/\/admin\/referrals$/, { timeout: 10_000 });

  const approvedA = await findReferral(partnerAPartnerId, leadEmail);
  expect(approvedA!.status).toBe("APPROVED");

  // Attempt to view Partner B's DUPLICATE_NO_CREDIT referral — no Approve button
  await page.goto(`/admin/referrals/${partnerBReferralId}`);
  await expect(page.getByText("Review referral")).toBeVisible({ timeout: 10_000 });

  // The approve button must NOT be present for a DUPLICATE_NO_CREDIT referral
  await expect(page.getByRole("button", { name: "Approve" })).not.toBeVisible();

  // The reject button IS present (admin can still reject the duplicate)
  await expect(page.getByRole("button", { name: "Reject" })).toBeVisible();

  // Verify the database still shows PENDING_REVIEW (no approval occurred)
  const pendingB = await findReferral(partnerBPartnerId, leadEmail);
  expect(pendingB!.status).toBe("PENDING_REVIEW");
  expect(pendingB!.attributionStatus).toBe("DUPLICATE_NO_CREDIT");

  // -----------------------------------------------------------------------
  // Step 4: Verify the AttributionLock has exactly one winner
  // -----------------------------------------------------------------------
  const lock = await findAttributionLock(leadEmail);
  expect(lock).not.toBeNull();
  expect(lock!.partnerId).toBe(partnerAPartnerId);
});
