import {
  validateFeedbackRequest,
  type FeedbackRequest,
} from "@/lib/feedback/contract";
import { submitFeedbackToJira } from "@/lib/feedback/jira";

type SubmitFeedback = (
  report: FeedbackRequest,
) => Promise<{ issueKey: string; existing: boolean }>;

type FeedbackRouteDeps = {
  submit: SubmitFeedback;
};

export async function handleFeedbackSubmit(
  request: Request,
  deps: FeedbackRouteDeps = { submit: submitFeedbackToJira },
): Promise<Response> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return Response.json(
      { status: "error", error: "JSON content is required." },
      { status: 415 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { status: "error", error: "Invalid JSON request." },
      { status: 400 },
    );
  }

  const validation = validateFeedbackRequest(body);
  if (!validation.ok) {
    return Response.json(
      { status: "error", field_errors: validation.fieldErrors },
      { status: 400 },
    );
  }

  try {
    const result = await deps.submit(validation.value);
    return Response.json(
      {
        status: "ok",
        issue_key: result.issueKey,
        existing: result.existing,
      },
      { status: result.existing ? 200 : 201 },
    );
  } catch {
    console.error("Feedback Jira submission failed", {
      submissionId: validation.value.submission_id,
    });
    return Response.json(
      {
        status: "error",
        error: "Feedback could not be submitted. Please try again.",
      },
      { status: 502 },
    );
  }
}
