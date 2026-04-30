"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { markBatchPaidAction, clawbackEventAction } from "./actions";

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
      <Button
        variant="danger"
        size="sm"
        onClick={() => setShowForm(true)}
        type="button"
      >
        Clawback
      </Button>
    );
  }

  return (
    <form
      onSubmit={handleClawback}
      className="flex min-w-[16rem] flex-col gap-3"
    >
      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason (required)"
        required
        className="border-b border-[var(--border-dark)] bg-transparent py-1 font-body text-sm text-[var(--sl-cream)] placeholder:text-[var(--sl-silver)]/50 focus:border-[var(--sl-cream)] focus:outline-none"
      />
      {error ? (
        <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--status-danger-text)]">
          {error}
        </p>
      ) : null}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowForm(false)}
        >
          Cancel
        </Button>
        <Button type="submit" variant="danger" size="sm" disabled={isPending}>
          {isPending ? "…" : "Confirm"}
        </Button>
      </div>
    </form>
  );
}

function MarkBatchPaidButton({ batchId }: { batchId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleMarkPaid() {
    if (
      !confirm(
        "Mark this payout batch as paid? This will mark all commission events as PAID.",
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
    <div className="flex flex-col gap-2">
      <Button onClick={handleMarkPaid} disabled={isPending} size="sm">
        {isPending ? "Marking…" : "Mark as paid"}
      </Button>
      {error ? (
        <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--status-danger-text)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type Props =
  | { batchId: string; batchStatus: string; clawbackEventId?: undefined }
  | { batchId: string; batchStatus: string; clawbackEventId: string };

export default function PayoutBatchActions({
  batchId,
  batchStatus,
  clawbackEventId,
}: Props) {
  if (clawbackEventId) {
    return <ClawbackLineButton eventId={clawbackEventId} />;
  }
  if (batchStatus === "PAID" || batchStatus === "VOIDED") {
    return null;
  }
  return <MarkBatchPaidButton batchId={batchId} />;
}
