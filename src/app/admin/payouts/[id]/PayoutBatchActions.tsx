"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markBatchPaidAction, clawbackEventAction } from "./actions";

const buttonBase: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "0.4375rem 0.875rem",
  borderRadius: "0.375rem",
  fontSize: "0.875rem",
  fontWeight: 500,
  cursor: "pointer",
  border: "none",
};

// ---------------------------------------------------------------------------
// ClawbackLineButton — inline clawback for a single commission event
// ---------------------------------------------------------------------------

function ClawbackLineButton({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleClawback(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await clawbackEventAction({ eventId, reason });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setShowForm(false);
      router.refresh();
    });
  }

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        style={{
          ...buttonBase,
          backgroundColor: "transparent",
          color: "#f87171",
          border: "1px solid rgba(248,113,113,0.3)",
        }}
      >
        Clawback
      </button>
    );
  }

  return (
    <form
      onSubmit={handleClawback}
      style={{ display: "flex", flexDirection: "column", gap: "0.5rem", minWidth: "16rem" }}
    >
      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason (required)"
        required
        style={{
          padding: "0.375rem 0.625rem",
          backgroundColor: "var(--sl-charcoal)",
          border: "1px solid var(--border-dark)",
          borderRadius: "0.375rem",
          color: "var(--sl-cream)",
          fontSize: "0.8125rem",
          outline: "none",
        }}
      />
      {error && <p style={{ color: "#f87171", fontSize: "0.75rem" }}>{error}</p>}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button
          type="button"
          onClick={() => setShowForm(false)}
          style={{
            ...buttonBase,
            backgroundColor: "transparent",
            color: "var(--sl-silver)",
            border: "1px solid var(--border-dark)",
            padding: "0.3125rem 0.625rem",
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          style={{
            ...buttonBase,
            backgroundColor: "#dc2626",
            color: "#fff",
            padding: "0.3125rem 0.625rem",
            opacity: isPending ? 0.7 : 1,
          }}
        >
          {isPending ? "…" : "Confirm"}
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// MarkBatchPaidButton
// ---------------------------------------------------------------------------

function MarkBatchPaidButton({ batchId }: { batchId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleMarkPaid() {
    if (
      !confirm(
        "Mark this payout batch as paid? This will mark all commission events as PAID."
      )
    )
      return;
    setError(null);
    startTransition(async () => {
      const result = await markBatchPaidAction(batchId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <button
        onClick={handleMarkPaid}
        disabled={isPending}
        style={{
          ...buttonBase,
          backgroundColor: "var(--sl-lavender)",
          color: "var(--sl-obsidian)",
          opacity: isPending ? 0.7 : 1,
        }}
      >
        {isPending ? "Marking…" : "Mark as Paid"}
      </button>
      {error && <p style={{ color: "#f87171", fontSize: "0.8125rem" }}>{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PayoutBatchActions — public entry point used by the detail page
// ---------------------------------------------------------------------------

type Props =
  | { batchId: string; batchStatus: string; clawbackEventId?: undefined }
  | { batchId: string; batchStatus: string; clawbackEventId: string };

export default function PayoutBatchActions({ batchId, batchStatus, clawbackEventId }: Props) {
  if (clawbackEventId) {
    return <ClawbackLineButton eventId={clawbackEventId} />;
  }
  if (batchStatus === "PAID" || batchStatus === "VOIDED") {
    return null;
  }
  return <MarkBatchPaidButton batchId={batchId} />;
}
