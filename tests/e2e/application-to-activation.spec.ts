/**
 * E2E: Application submission → admin approval → agreement signed → partner activation.
 *
 * This test drives the full legal onboarding workflow through real app routes.
 * Auth is established via programmatic session cookies (same HMAC signing as production).
 * Email sends use the stub adapter (no RESEND_API_KEY required in dev).
 */
import { test, expect } from "@playwright/test";
import { setAdminSession } from "./helpers/session";
import {
  createTestAdmin,
  deleteApplication,
  deleteActivatedPartnerByEmail,
  deleteUserAndDownstream,
  findApplication,
  findAgreement,
  findPartnerByApplicationId,
  findUser,
  getOrCreateDefaultTier,
} from "./helpers/db";

// ---------------------------------------------------------------------------
// Test state tracked across steps for cleanup
// ---------------------------------------------------------------------------

let adminUserId = "";
let applicationId = "";
const tag = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const applicantEmail = `e2e-applicant-${tag}@test.example`;
const adminEmail = `e2e-admin-${tag}@test.example`;

test.beforeAll(async () => {
  // Ensure a default tier exists (needed for partner activation)
  await getOrCreateDefaultTier();

  // Create an isolated admin user for this test run
  const admin = await createTestAdmin(adminEmail);
  adminUserId = admin.id;
});

test.afterAll(async () => {
  // Clean up the test application and any activated partner
  if (applicationId) await deleteApplication(applicationId);
  await deleteActivatedPartnerByEmail(applicantEmail);
  if (adminUserId) await deleteUserAndDownstream(adminUserId);
});

test("application submission → admin approval → agreement signed → partner activation", async ({
  page,
  context,
}) => {
  // -----------------------------------------------------------------------
  // Step 1: Public applicant fills and submits /apply
  // -----------------------------------------------------------------------
  await page.goto("/apply");
  await expect(page).toHaveTitle(/Apply to Partner/);

  await page.fill("#fullName", "Eve Thornton");
  await page.fill("#email", applicantEmail);
  await page.fill("#phone", "+1 555 000 0000");
  await page.fill("#company", "Thornton Consulting");
  await page.fill("#country", "United States");

  // Select at least one promotion channel
  await page.check('input[name="promotionChannels"][value="consulting"]');

  await page.fill("#aiTechExperience", "10 years working with enterprise ML APIs and LLMs");
  await page.fill("#audience", "CTOs and VP Engineering at mid-market companies");
  await page.fill("#whyPartner", "Belief in human-centered AI aligns with my practice");
  await page.fill("#promotionStrategy", "Direct outreach to my executive network");
  await page.fill("#audienceFit", "My audience makes AI adoption decisions daily");

  await page.click('button[type="submit"]:has-text("Submit application")');

  // Success view confirms submission
  await expect(page.getByText("Application submitted")).toBeVisible({ timeout: 10_000 });

  // Retrieve the created application from the database
  const app = await findApplication(applicantEmail);
  expect(app).not.toBeNull();
  expect(app!.status).toBe("SUBMITTED");
  applicationId = app!.id;

  // -----------------------------------------------------------------------
  // Step 2: Admin reviews and approves the application
  // -----------------------------------------------------------------------
  await setAdminSession(context, adminUserId);

  await page.goto(`/admin/applications/${applicationId}`);
  await expect(page.getByText("Review actions")).toBeVisible({ timeout: 10_000 });

  // Click "Approve — pending agreement"
  await page.click('button:has-text("Approve — pending agreement")');

  // After router.refresh(), the ReviewActions re-renders; the status pill updates
  await expect(page.getByText("Approved — pending agreement", { exact: true })).toBeVisible({ timeout: 10_000 });

  const approved = await findApplication(applicantEmail);
  expect(approved!.status).toBe("APPROVED_PENDING_AGREEMENT");

  // -----------------------------------------------------------------------
  // Step 3: Admin sends the agreement packet from the application detail page
  // -----------------------------------------------------------------------
  // The "Send agreement packet" button is visible because status is APPROVED_PENDING_AGREEMENT
  await page.click('button:has-text("Send agreement packet")');

  // After sending, status becomes AGREEMENT_SENT — the button disappears
  await expect(page.getByText("Agreement sent", { exact: true })).toBeVisible({ timeout: 10_000 });

  const sent = await findApplication(applicantEmail);
  expect(sent!.status).toBe("AGREEMENT_SENT");

  // -----------------------------------------------------------------------
  // Step 4: Admin marks the agreement as signed from /admin/agreements
  // -----------------------------------------------------------------------
  await page.goto("/admin/agreements");
  await expect(page).toHaveURL(/\/admin\/agreements/);

  // Find the row for this applicant and click "Mark signed"
  const agreementRow = page.locator("tr").filter({ hasText: applicantEmail });
  await agreementRow.getByRole("button", { name: "Mark signed" }).click();

  // The inline evidence form appears — provide a manual note
  await agreementRow
    .locator('textarea[placeholder*="Manual evidence note"]')
    .fill("Signed PDF received via email on " + new Date().toLocaleDateString());

  await agreementRow.getByRole("button", { name: "Confirm signed" }).click();

  await expect
    .poll(async () => (await findAgreement(applicationId))?.status, { timeout: 10_000 })
    .toBe("SIGNED");

  const agreement = await findAgreement(applicationId);
  expect(agreement).not.toBeNull();
  expect(agreement!.status).toBe("SIGNED");

  // -----------------------------------------------------------------------
  // Step 5: Admin activates the partner
  // -----------------------------------------------------------------------
  // "Activate partner" button appears now that status === SIGNED and hasEvidence
  const signedRow = page.locator("tr").filter({ hasText: applicantEmail });
  await signedRow.getByRole("button", { name: "Activate partner" }).click();

  // After activation, the application page would show ACTIVATED.
  // Verify the partner record was created in the database.
  await page.waitForTimeout(1_500); // allow router.refresh to settle

  const partner = await findPartnerByApplicationId(applicationId);
  expect(partner).not.toBeNull();
  expect(partner!.status).toBe("ACTIVE");

  const user = await findUser(applicantEmail);
  expect(user).not.toBeNull();
  expect(user!.role).toBe("PARTNER");
  expect(user!.status).toBe("ACTIVE");

  const finalApp = await findApplication(applicantEmail);
  expect(finalApp!.status).toBe("ACTIVATED");
});
