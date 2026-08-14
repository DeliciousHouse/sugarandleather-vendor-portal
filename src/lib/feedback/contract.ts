import { z } from "zod";

import {
  FEEDBACK_CATEGORIES,
  FEEDBACK_IMPACTS,
  FEEDBACK_LIMITS,
  type FeedbackCategory,
  type FeedbackImpact,
} from "@/lib/feedback/options";

export {
  FEEDBACK_CATEGORIES,
  FEEDBACK_CATEGORY_OPTIONS,
  FEEDBACK_IMPACTS,
  FEEDBACK_IMPACT_OPTIONS,
  FEEDBACK_LIMITS,
  type FeedbackCategory,
  type FeedbackImpact,
} from "@/lib/feedback/options";

export type FeedbackRequest = {
  submission_id: string;
  category: FeedbackCategory;
  impact: FeedbackImpact;
  title: string;
  description: string;
  page_path: string;
};

export type FeedbackValidation =
  | { ok: true; value: FeedbackRequest }
  | { ok: false; fieldErrors: Record<string, string> };

const feedbackRequestSchema = z
  .object({
    submission_id: z
      .string()
      .uuid("A valid submission ID is required.")
      .transform((value) => value.toLowerCase()),
    category: z.enum(FEEDBACK_CATEGORIES, "Choose a feedback type."),
    impact: z.enum(FEEDBACK_IMPACTS, "Choose how much this affects you."),
    title: z
      .string()
      .trim()
      .min(1, "Give your report a short title.")
      .max(FEEDBACK_LIMITS.titleMax, "Keep the title to 255 characters or fewer."),
    description: z
      .string()
      .trim()
      .min(1, "Describe what happened.")
      .max(
        FEEDBACK_LIMITS.descriptionMax,
        "Keep the description to 10,000 characters or fewer.",
      ),
    page_path: z
      .string()
      .min(1, "A page path is required.")
      .max(FEEDBACK_LIMITS.pagePathMax, "The page path is too long.")
      .regex(
        /^\/[^?#\u0000-\u001f\u007f]*$/,
        "The page path must not include an origin, query, or hash.",
      ),
  })
  .strict();

export function validateFeedbackRequest(input: unknown): FeedbackValidation {
  const result = feedbackRequestSchema.safeParse(input);
  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      if (issue.code === "unrecognized_keys") {
        fieldErrors.request = "Only feedback fields are accepted.";
        continue;
      }

      const field = issue.path[0];
      if (typeof field === "string" && fieldErrors[field] === undefined) {
        fieldErrors[field] = issue.message;
      } else if (fieldErrors.request === undefined) {
        fieldErrors.request = "Invalid feedback request.";
      }
    }

    return { ok: false, fieldErrors };
  }

  return {
    ok: true,
    value: {
      submission_id: result.data.submission_id!,
      category: result.data.category,
      impact: result.data.impact,
      title: result.data.title,
      description: result.data.description,
      page_path: result.data.page_path,
    },
  };
}
