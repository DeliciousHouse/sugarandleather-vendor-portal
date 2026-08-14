import { describe, expect, it } from "vitest";

import { validateFeedbackRequest } from "@/lib/feedback/contract";

const validRequest = {
  submission_id: "123e4567-e89b-42d3-a456-426614174000",
  category: "bug",
  impact: "p2_feature_degraded",
  title: "  Referral form does not submit  ",
  description: "  The form keeps my input but never advances.  ",
  page_path: "/partner/referrals/new",
};

describe("feedback request contract", () => {
  it("accepts and normalizes the browser allowlist", () => {
    const result = validateFeedbackRequest(validRequest);

    expect(result).toEqual({
      ok: true,
      value: {
        ...validRequest,
        title: "Referral form does not submit",
        description: "The form keeps my input but never advances.",
      },
    });
  });

  it.each([
    ["submission_id", "not-a-uuid"],
    ["category", "feature"],
    ["impact", "critical"],
    ["title", "   "],
    ["title", "x".repeat(256)],
    ["description", "   "],
    ["description", "x".repeat(10_001)],
    ["page_path", "partner/referrals"],
    ["page_path", "/partner/referrals?token=secret"],
    ["page_path", "/partner/referrals#details"],
    ["page_path", `/${"x".repeat(512)}`],
  ])("rejects invalid %s values", (field, value) => {
    const result = validateFeedbackRequest({ ...validRequest, [field]: value });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.fieldErrors[field]).toBeTruthy();
  });

  it("rejects browser-supplied identity, project, and hidden data", () => {
    const result = validateFeedbackRequest({
      ...validRequest,
      project: "OTHER",
      email: "private@example.com",
      user_agent: "secret browser details",
      screenshot: "private page capture",
    });

    expect(result).toEqual({
      ok: false,
      fieldErrors: { request: "Only feedback fields are accepted." },
    });
  });
});
