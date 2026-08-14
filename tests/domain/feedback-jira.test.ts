import { describe, expect, it, vi } from "vitest";

import {
  buildJiraIssue,
  createJiraFeedbackClient,
  feedbackIdempotencyLabel,
  type JiraFeedbackConfig,
} from "@/lib/feedback/jira";
import type { FeedbackRequest } from "@/lib/feedback/contract";

const report: FeedbackRequest = {
  submission_id: "123e4567-e89b-42d3-a456-426614174000",
  category: "bug",
  impact: "p2_feature_degraded",
  title: "Referral form does not submit",
  description: "The form keeps my input but never advances.",
  page_path: "/partner/referrals/new",
};

const config: JiraFeedbackConfig = {
  baseUrl: "https://jira.example.test",
  email: "feedback@example.test",
  apiToken: "jira-super-secret-token",
};

function adfText(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(adfText);
  if (!value || typeof value !== "object") return [];

  const object = value as Record<string, unknown>;
  return [
    ...(typeof object.text === "string" ? [object.text] : []),
    ...adfText(object.content),
  ];
}

describe("Vendor Portal Jira feedback", () => {
  it("hard-pins GEN and explicit Vendor Portal identity with pathname context", () => {
    const issue = buildJiraIssue(report);
    const fields = issue.fields as Record<string, unknown>;
    const text = adfText(fields.description).join("\n");

    expect(fields.project).toEqual({ key: "GEN" });
    expect(fields.summary).toBe("[Vendor Portal] Referral form does not submit");
    expect(fields.labels).toEqual(
      expect.arrayContaining([
        "vendor-portal",
        "vendor-portal-feedback",
        "feedback-bug",
        "impact-p2",
        feedbackIdempotencyLabel(report.submission_id),
      ]),
    );
    expect(text).toContain("Product: Vendor Portal (vendor-portal)");
    expect(text).toContain("Page: /partner/referrals/new");
    expect(text).toContain(report.description);
  });

  it("returns an existing GEN issue before create on retry", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({ issues: [{ key: "GEN-56" }] }),
    );
    const client = createJiraFeedbackClient(config, fetchMock as typeof fetch);

    await expect(client.submit(report)).resolves.toEqual({
      issueKey: "GEN-56",
      existing: true,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/rest/api/3/search/jql?");
    expect(decodeURIComponent(String(url))).toContain("project = GEN");
    expect(decodeURIComponent(String(url))).toContain(
      feedbackIdempotencyLabel(report.submission_id),
    );
    expect(init.method).toBe("GET");
  });

  it("creates one fixed-project issue when the label is new", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ issues: [] }))
      .mockResolvedValueOnce(Response.json({ key: "GEN-57" }, { status: 201 }));
    const client = createJiraFeedbackClient(config, fetchMock as typeof fetch);

    await expect(client.submit(report)).resolves.toEqual({
      issueKey: "GEN-57",
      existing: false,
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [url, init] = fetchMock.mock.calls[1];
    expect(String(url)).toBe("https://jira.example.test/rest/api/3/issue");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual(buildJiraIssue(report));
  });

  it("fails closed instead of creating when Jira search is malformed", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      Response.json({ unexpected: `raw ${config.apiToken} details` }),
    );
    const client = createJiraFeedbackClient(config, fetchMock as typeof fetch);

    await expect(client.submit(report)).rejects.toThrow(
      "Jira search returned an invalid response",
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("coalesces rapid duplicate submissions into one search/create cycle", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ issues: [] }))
      .mockResolvedValueOnce(Response.json({ key: "GEN-58" }, { status: 201 }));
    const client = createJiraFeedbackClient(config, fetchMock as typeof fetch);

    const [first, second] = await Promise.all([
      client.submit(report),
      client.submit(report),
    ]);

    expect(first).toEqual({ issueKey: "GEN-58", existing: false });
    expect(second).toEqual(first);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("finds the existing issue after a lost create acknowledgement", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ issues: [] }))
      .mockRejectedValueOnce(
        new Error(`socket closed after ${config.apiToken} was accepted`),
      )
      .mockResolvedValueOnce(Response.json({ issues: [{ key: "GEN-59" }] }));
    const client = createJiraFeedbackClient(config, fetchMock as typeof fetch);

    await expect(client.submit(report)).rejects.toThrow("Jira transport failed");
    await expect(client.submit(report)).resolves.toEqual({
      issueKey: "GEN-59",
      existing: true,
    });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(
      fetchMock.mock.calls.filter(([, init]) => init.method === "POST"),
    ).toHaveLength(1);
  });

  it("scrubs Jira response and transport details from errors", async () => {
    const basic = Buffer.from(`${config.email}:${config.apiToken}`).toString("base64");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(`raw ${config.apiToken} ${basic} account details`, {
        status: 500,
      }),
    );
    const client = createJiraFeedbackClient(config, fetchMock as typeof fetch);

    let message = "";
    try {
      await client.submit(report);
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }

    expect(message).toBe("Jira search failed (HTTP 500)");
    expect(message).not.toContain(config.apiToken);
    expect(message).not.toContain(basic);
    expect(message).not.toContain("account details");
  });

  it("bounds Jira requests with an aborting timeout", async () => {
    const fetchMock = vi.fn((_url: string, init: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init.signal?.addEventListener("abort", () =>
          reject(new Error(`aborted with ${config.apiToken}`)),
        );
      }),
    );
    const client = createJiraFeedbackClient(
      config,
      fetchMock as typeof fetch,
      1,
    );

    await expect(client.submit(report)).rejects.toThrow("Jira request timed out");
    expect(fetchMock.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
  });
});
