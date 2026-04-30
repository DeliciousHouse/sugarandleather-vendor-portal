"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import type { ApplicationDetail } from "@/components/applications/ApplicationReviewPanel";
import {
  markInReviewAction,
  rejectApplicationAction,
  approvePendingAgreementAction,
} from "./actions";

interface ReviewActionsProps {
  app: Pick<ApplicationDetail, "id" | "status">;
}

export default function ReviewActions({ app }: ReviewActionsProps) {
  const [notes, setNotes] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const canMarkInReview = app.status === "SUBMITTED";
  const canReject =
    app.status === "SUBMITTED" || app.status === "IN_REVIEW";
  const canApprove =
    app.status === "SUBMITTED" || app.status === "IN_REVIEW";

  if (!canMarkInReview && !canReject && !canApprove) return null;

  function runAction(fn: () => Promise<{ error?: string }>) {
    setActionError(null);
    startTransition(async () => {
      const result = await fn();
      if (result.error) {
        setActionError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div
      className="rounded-xl border p-5 flex flex-col gap-4"
      style={{
        backgroundColor: "var(--surface-panel)",
        borderColor: "var(--border-dark)",
      }}
    >
      <h2
        className="text-sm font-semibold"
        style={{ color: "var(--sl-silver)" }}
      >
        Review actions
      </h2>

      {actionError && (
        <div
          role="alert"
          className="text-sm rounded-lg border p-3"
          style={{
            backgroundColor: "var(--status-danger-bg)",
            borderColor: "var(--status-danger-border)",
            color: "var(--status-danger-text)",
          }}
        >
          {actionError}
        </div>
      )}

      <div>
        <label
          htmlFor="reviewNotes"
          className="text-sm block mb-1.5"
          style={{ color: "var(--sl-silver)" }}
        >
          Admin notes
        </label>
        <textarea
          id="reviewNotes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes to record with this action"
          rows={3}
          className="w-full rounded-lg text-sm"
          style={{
            backgroundColor: "var(--sl-obsidian)",
            border: "1px solid var(--border-dark)",
            color: "var(--sl-cream)",
            padding: "10px 12px",
            resize: "vertical",
          }}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        {canMarkInReview && (
          <Button
            variant="secondary"
            size="sm"
            disabled={isPending}
            onClick={() => runAction(() => markInReviewAction(app.id))}
          >
            Mark in review
          </Button>
        )}
        {canApprove && (
          <Button
            variant="primary"
            size="sm"
            disabled={isPending}
            onClick={() =>
              runAction(() =>
                approvePendingAgreementAction(app.id, notes || undefined)
              )
            }
          >
            Approve — pending agreement
          </Button>
        )}
        {canReject && (
          <Button
            variant="danger"
            size="sm"
            disabled={isPending || !notes.trim()}
            onClick={() =>
              runAction(() => rejectApplicationAction(app.id, notes))
            }
          >
            Reject
          </Button>
        )}
      </div>

      {canReject && !notes.trim() && (
        <p className="text-xs" style={{ color: "var(--sl-mid-gray)" }}>
          Notes are required to reject an application.
        </p>
      )}
    </div>
  );
}
