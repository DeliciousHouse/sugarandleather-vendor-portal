import { expect, test } from "@playwright/test";

test.describe("global Vendor Portal feedback", () => {
  test("desktop trigger stays layered and small, with native keyboard dismissal", async ({
    page,
  }) => {
    await page.goto("/login");

    const trigger = page.getByRole("button", { name: "Send feedback" });
    await expect(trigger).toBeVisible();
    const box = await trigger.boundingBox();
    const viewport = page.viewportSize();
    expect(box).not.toBeNull();
    expect(viewport).not.toBeNull();
    expect((box!.width * box!.height) / (viewport!.width * viewport!.height)).toBeLessThan(
      0.03,
    );
    expect(await trigger.evaluate((element) => getComputedStyle(element).position)).toBe(
      "fixed",
    );
    expect(
      Number(await trigger.evaluate((element) => getComputedStyle(element).zIndex)),
    ).toBeGreaterThanOrEqual(100);

    await trigger.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog", { name: "Send feedback" });
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("mobile dialog fits the viewport and sends only pathname context", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    let payload: Record<string, unknown> | undefined;
    await page.route("**/api/feedback/submit", async (route) => {
      payload = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          status: "ok",
          issue_key: "GEN-62",
          existing: false,
        }),
      });
    });
    await page.goto("/login?token=private#contact");

    await page.getByRole("button", { name: "Send feedback" }).click();
    const dialog = page.getByRole("dialog", { name: "Send feedback" });
    await expect(dialog).toBeVisible();
    const box = await dialog.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(390);
    expect(box!.y + box!.height).toBeLessThanOrEqual(844);

    await page
      .getByLabel("How much does this affect you?")
      .selectOption("p2_feature_degraded");
    await page.getByLabel("Short title").fill("Mobile login feedback");
    await page.getByLabel("What happened?").fill("The mobile form stayed usable.");
    await page.getByRole("button", { name: "Submit feedback" }).click();

    await expect(page.getByText("Feedback sent as GEN-62.")).toBeVisible();
    expect(payload).toBeDefined();
    expect(Object.keys(payload!).sort()).toEqual([
      "category",
      "description",
      "impact",
      "page_path",
      "submission_id",
      "title",
    ]);
    expect(payload!.page_path).toBe("/login");
    expect(JSON.stringify(payload)).not.toContain("private");
  });
});
