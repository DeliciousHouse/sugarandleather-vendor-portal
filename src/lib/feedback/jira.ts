import {
  FEEDBACK_IMPACT_OPTIONS,
} from "@/lib/feedback/options";
import type { FeedbackRequest } from "@/lib/feedback/contract";
import { getEnv } from "@/lib/env";

export const FEEDBACK_JIRA_PROJECT_KEY = "GEN";
export const FEEDBACK_JIRA_TIMEOUT_MS = 15_000;

const ISSUE_SUMMARY_MAX = 255;
const IDEMPOTENCY_PREFIX = "vendor-portal-sub-";
const GEN_ISSUE_KEY = /^GEN-\d+$/;

export type JiraFeedbackConfig = {
  baseUrl: string;
  email: string;
  apiToken: string;
};

export class JiraFeedbackError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JiraFeedbackError";
  }
}

export function feedbackIdempotencyLabel(submissionId: string): string {
  return `${IDEMPOTENCY_PREFIX}${submissionId.toLowerCase()}`;
}

function paragraph(text: string) {
  return {
    type: "paragraph",
    content: [{ type: "text", text }],
  };
}

export function buildJiraIssue(report: FeedbackRequest) {
  const impact = FEEDBACK_IMPACT_OPTIONS.find(
    (option) => option.value === report.impact,
  );

  return {
    fields: {
      project: { key: FEEDBACK_JIRA_PROJECT_KEY },
      issuetype: { name: report.category === "bug" ? "Bug" : "Task" },
      summary: `[Vendor Portal] ${report.title.replace(/\s+/g, " ").trim()}`.slice(
        0,
        ISSUE_SUMMARY_MAX,
      ),
      labels: [
        "vendor-portal",
        "vendor-portal-feedback",
        `feedback-${report.category}`,
        `impact-${report.impact.slice(0, 2)}`,
        feedbackIdempotencyLabel(report.submission_id),
      ],
      description: {
        type: "doc",
        version: 1,
        content: [
          paragraph(report.description),
          paragraph("—"),
          paragraph("Product: Vendor Portal (vendor-portal)"),
          paragraph(`Page: ${report.page_path}`),
          paragraph(`Category: ${report.category}`),
          paragraph(`Impact: ${impact?.label ?? report.impact}`),
          paragraph(`Submission ID: ${report.submission_id}`),
        ],
      },
    },
  };
}

export function createJiraFeedbackClient(
  config: JiraFeedbackConfig,
  fetchImpl: typeof fetch = fetch,
  timeoutMs = FEEDBACK_JIRA_TIMEOUT_MS,
) {
  const baseUrl = config.baseUrl.replace(/\/$/, "");
  const authorization = `Basic ${Buffer.from(
    `${config.email}:${config.apiToken}`,
  ).toString("base64")}`;
  // ponytail: Jira has no unique-create key; use a DB claim if cross-instance exact-once is required.
  const inFlight = new Map<
    string,
    Promise<{ issueKey: string; existing: boolean }>
  >();

  async function request(path: string, init: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await fetchImpl(`${baseUrl}${path}`, {
        ...init,
        headers: {
          Authorization: authorization,
          Accept: "application/json",
          ...init.headers,
        },
        signal: controller.signal,
      });
    } catch {
      throw new JiraFeedbackError(
        controller.signal.aborted
          ? "Jira request timed out"
          : "Jira transport failed",
      );
    } finally {
      clearTimeout(timer);
    }
  }

  async function parseJson(
    response: Response,
    context: "search" | "create",
  ): Promise<Record<string, unknown>> {
    try {
      const body: unknown = await response.json();
      if (!body || typeof body !== "object" || Array.isArray(body)) {
        throw new Error("invalid response");
      }
      return body as Record<string, unknown>;
    } catch {
      throw new JiraFeedbackError(`Jira ${context} returned invalid JSON`);
    }
  }

  async function submitOnce(
    report: FeedbackRequest,
  ): Promise<{ issueKey: string; existing: boolean }> {
    const label = feedbackIdempotencyLabel(report.submission_id);
    const jql = `project = ${FEEDBACK_JIRA_PROJECT_KEY} AND labels = "${label}"`;
    const search = await request(
      `/rest/api/3/search/jql?jql=${encodeURIComponent(jql)}&fields=key&maxResults=1`,
      { method: "GET" },
    );
    if (!search.ok) {
      throw new JiraFeedbackError(`Jira search failed (HTTP ${search.status})`);
    }

    const searchBody = await parseJson(search, "search");
    if (!Array.isArray(searchBody.issues)) {
      throw new JiraFeedbackError("Jira search returned an invalid response");
    }
    const issues = searchBody.issues;
    const existingKey = (issues[0] as { key?: unknown } | undefined)?.key;
    if (existingKey !== undefined) {
      if (typeof existingKey !== "string" || !GEN_ISSUE_KEY.test(existingKey)) {
        throw new JiraFeedbackError("Jira search returned an invalid issue key");
      }
      return { issueKey: existingKey, existing: true };
    }

    const created = await request("/rest/api/3/issue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildJiraIssue(report)),
    });
    if (!created.ok) {
      throw new JiraFeedbackError(`Jira create failed (HTTP ${created.status})`);
    }

    const createdBody = await parseJson(created, "create");
    if (typeof createdBody.key !== "string" || !GEN_ISSUE_KEY.test(createdBody.key)) {
      throw new JiraFeedbackError("Jira create returned an invalid issue key");
    }
    return { issueKey: createdBody.key, existing: false };
  }

  return {
    submit(report: FeedbackRequest) {
      const active = inFlight.get(report.submission_id);
      if (active) return active;

      const submission = submitOnce(report);
      inFlight.set(report.submission_id, submission);
      submission.then(
        () => inFlight.delete(report.submission_id),
        () => inFlight.delete(report.submission_id),
      );
      return submission;
    },
  };
}

let defaultClient: ReturnType<typeof createJiraFeedbackClient> | undefined;

function getDefaultClient() {
  if (defaultClient) return defaultClient;

  const env = getEnv();
  const baseUrl = env.JIRA_BASE_URL?.trim();
  const email = env.JIRA_EMAIL?.trim();
  const apiToken = env.JIRA_API_TOKEN?.trim();
  if (!baseUrl || !email || !apiToken) {
    throw new JiraFeedbackError("Jira feedback is not configured");
  }

  let parsedBaseUrl: URL;
  try {
    parsedBaseUrl = new URL(baseUrl);
  } catch {
    throw new JiraFeedbackError("Jira feedback is not configured");
  }
  if (!/^https?:$/.test(parsedBaseUrl.protocol) || parsedBaseUrl.username) {
    throw new JiraFeedbackError("Jira feedback is not configured");
  }

  defaultClient = createJiraFeedbackClient({
    baseUrl: parsedBaseUrl.toString().replace(/\/$/, ""),
    email,
    apiToken,
  });
  return defaultClient;
}

export function submitFeedbackToJira(report: FeedbackRequest) {
  return getDefaultClient().submit(report);
}
