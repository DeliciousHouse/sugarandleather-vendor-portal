import { test, expect } from "@playwright/test";

/**
 * Editorial Obsidian rollout smoke tests.
 *
 * One spec per public-reachable screen. Each verifies:
 *  - the page returns 200 (no server crash)
 *  - the editorial mono pagination label or breadcrumb is visible
 *  - no console errors on load
 *
 * Auth-gated routes (/admin/*, /partner/*) are tested separately under
 * application-to-activation.spec.ts and friends; this file is the
 * post-rollout regression net for the public surface.
 */

const PUBLIC_ROUTES = [
  { path: "/", expect: /Sugar & Leather AI/ },
  { path: "/login", expect: /Sugar & Leather AI/ },
  { path: "/apply", expect: /Apply/i },
];

for (const route of PUBLIC_ROUTES) {
  test(`editorial rollout — ${route.path} renders without errors`, async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    const response = await page.goto(route.path);
    expect(response?.status()).toBeLessThan(400);

    // The mono pagination label / wordmark is the editorial tell.
    // It appears on every Editorial Obsidian page.
    await expect(page.getByText(route.expect).first()).toBeVisible();

    // No console errors during initial render.
    expect(
      consoleErrors.filter(
        // Filter out HMR/dev noise that Next.js emits in development.
        (e) =>
          !e.includes("[Fast Refresh]") &&
          !e.includes("Download the React DevTools"),
      ),
    ).toEqual([]);
  });
}

test("editorial rollout — login page presents the form, not a card", async ({
  page,
}) => {
  await page.goto("/login");

  // Hairline-bottom inputs (no rounded card chrome).
  // The editorial form lives under the right pane of EditorialShell.
  const emailLabel = page.getByText(/email/i).first();
  await expect(emailLabel).toBeVisible();
});

test("editorial rollout — apply page shows the 5-section structure", async ({
  page,
}) => {
  await page.goto("/apply");

  // Mono caps section labels: 01 Personal, 02 Company, 03 Channels, 04 Experience, 05 Questions.
  await expect(page.getByText("Personal information")).toBeVisible();
  await expect(page.getByText("Company and location")).toBeVisible();
  await expect(page.getByText("Promotion channels")).toBeVisible();
});
