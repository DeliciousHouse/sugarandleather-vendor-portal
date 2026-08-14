import { afterEach, describe, expect, it, vi } from "vitest";

import { handleFeedbackSubmit } from "@/app/api/feedback/submit/handler";

const validRequest = {
  submission_id: "123e4567-e89b-42d3-a456-426614174000",
  category: "bug",
  impact: "p2_feature_degraded",
  title: "Referral form does not submit",
  description: "The form keeps my input but never advances.",
  page_path: "/partner/referrals/new",
};

function request(body: unknown): Request {
  return new Request("http://localhost/api/feedback/submit", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("POST /api/feedback/submit", () => {
  it("submits the validated browser allowlist and returns the issue key", async () => {
    const submit = vi.fn().mockResolvedValue({
      issueKey: "GEN-60",
      existing: false,
    });

    const response = await handleFeedbackSubmit(request(validRequest), { submit });

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      status: "ok",
      issue_key: "GEN-60",
      existing: false,
    });
    expect(submit).toHaveBeenCalledWith(validRequest);
  });

  it("returns an existing submission without creating client-visible Jira details", async () => {
    const submit = vi.fn().mockResolvedValue({
      issueKey: "GEN-60",
      existing: true,
    });

    const response = await handleFeedbackSubmit(request(validRequest), { submit });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: "ok",
      issue_key: "GEN-60",
      existing: true,
    });
  });

  it("rejects invalid JSON before calling Jira", async () => {
    const submit = vi.fn();
    const invalidRequest = new Request(
      "http://localhost/api/feedback/submit",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{not json",
      },
    );

    const response = await handleFeedbackSubmit(invalidRequest, { submit });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      status: "error",
      error: "Invalid JSON request.",
    });
    expect(submit).not.toHaveBeenCalled();
  });

  it("rejects non-JSON browser requests before calling Jira", async () => {
    const submit = vi.fn();
    const response = await handleFeedbackSubmit(
      new Request("http://localhost/api/feedback/submit", {
        method: "POST",
        headers: { "content-type": "text/plain" },
        body: JSON.stringify(validRequest),
      }),
      { submit },
    );

    expect(response.status).toBe(415);
    expect(submit).not.toHaveBeenCalled();
  });

  it("rejects browser-supplied project and hidden data before Jira", async () => {
    const submit = vi.fn();

    const response = await handleFeedbackSubmit(
      request({
        ...validRequest,
        project: "OTHER",
        email: "private@example.test",
        screenshot: "private page contents",
      }),
      { submit },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      status: "error",
      field_errors: { request: "Only feedback fields are accepted." },
    });
    expect(submit).not.toHaveBeenCalled();
  });

  it("returns one scrubbed retryable error for all Jira failures", async () => {
    const secret = "jira-super-secret-token";
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const submit = vi.fn().mockRejectedValue(
      new Error(`Jira returned raw account details containing ${secret}`),
    );

    const response = await handleFeedbackSubmit(request(validRequest), { submit });
    const body = await response.text();

    expect(response.status).toBe(502);
    expect(body).toBe(
      JSON.stringify({
        status: "error",
        error: "Feedback could not be submitted. Please try again.",
      }),
    );
    expect(body).not.toContain(secret);
    expect(body).not.toContain("account details");
    expect(errorSpy).toHaveBeenCalledWith("Feedback Jira submission failed", {
      submissionId: validRequest.submission_id,
    });
    expect(JSON.stringify(errorSpy.mock.calls)).not.toContain(secret);
    expect(JSON.stringify(errorSpy.mock.calls)).not.toContain("account details");
  });
});
