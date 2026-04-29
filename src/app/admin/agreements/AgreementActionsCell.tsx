"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import {
  sendAgreementPacketAction,
  markAgreementSignedAction,
  activatePartnerAction,
} from "./[id]/actions";

interface AgreementActionsCellProps {
  agreementId: string;
  status: string;
  applicationId?: string;
  hasEvidence: boolean;
}

export default function AgreementActionsCell({
  agreementId,
  status,
  applicationId,
  hasEvidence,
}: AgreementActionsCellProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showSignForm, setShowSignForm] = useState(false);
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [evidenceNote, setEvidenceNote] = useState("");
  const router = useRouter();

  function run(fn: () => Promise<{ error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await fn();
      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col gap-2 min-w-0">
      {error && (
        <p className="text-xs" style={{ color: "var(--status-danger-text)" }}>
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {/* Send / Resend */}
        {(status === "SENT" || applicationId) && (
          <Button
            variant="secondary"
            size="sm"
            disabled={isPending || !applicationId}
            onClick={() =>
              run(() => sendAgreementPacketAction(applicationId!))
            }
          >
            {status === "SENT" ? "Resend" : "Send packet"}
          </Button>
        )}

        {/* Mark signed */}
        {status === "SENT" && !showSignForm && (
          <Button
            variant="primary"
            size="sm"
            disabled={isPending}
            onClick={() => setShowSignForm(true)}
          >
            Mark signed
          </Button>
        )}

        {/* Activate partner */}
        {status === "SIGNED" && hasEvidence && (
          <Button
            variant="primary"
            size="sm"
            disabled={isPending}
            onClick={() =>
              run(() => activatePartnerAction(agreementId))
            }
          >
            Activate partner
          </Button>
        )}
      </div>

      {showSignForm && (
        <div
          className="rounded-lg border p-3 flex flex-col gap-2 mt-1"
          style={{
            backgroundColor: "var(--sl-obsidian)",
            borderColor: "var(--border-dark)",
          }}
        >
          <p className="text-xs font-medium" style={{ color: "var(--sl-silver)" }}>
            Provide at least one form of signed evidence
          </p>
          <input
            type="url"
            placeholder="Signed document URL (optional)"
            value={evidenceUrl}
            onChange={(e) => setEvidenceUrl(e.target.value)}
            className="rounded text-xs w-full"
            style={{
              backgroundColor: "var(--sl-charcoal)",
              border: "1px solid var(--border-dark)",
              color: "var(--sl-cream)",
              padding: "6px 8px",
            }}
          />
          <textarea
            placeholder="Manual evidence note (optional)"
            value={evidenceNote}
            onChange={(e) => setEvidenceNote(e.target.value)}
            rows={2}
            className="rounded text-xs w-full"
            style={{
              backgroundColor: "var(--sl-charcoal)",
              border: "1px solid var(--border-dark)",
              color: "var(--sl-cream)",
              padding: "6px 8px",
              resize: "vertical",
            }}
          />
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              disabled={isPending || (!evidenceUrl.trim() && !evidenceNote.trim())}
              onClick={() =>
                run(() =>
                  markAgreementSignedAction(
                    agreementId,
                    evidenceUrl || undefined,
                    evidenceNote || undefined
                  )
                )
              }
            >
              Confirm signed
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={isPending}
              onClick={() => setShowSignForm(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
