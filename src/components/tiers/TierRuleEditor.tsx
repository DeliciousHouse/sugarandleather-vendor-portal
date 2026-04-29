"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createTierAction,
  updateTierAction,
  deactivateTierAction,
  createCommissionRuleAction,
  deactivateCommissionRuleAction,
} from "@/app/admin/tiers/[id]/actions";

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.5rem 0.75rem",
  backgroundColor: "var(--sl-charcoal)",
  border: "1px solid var(--border-dark)",
  borderRadius: "0.375rem",
  color: "var(--sl-cream)",
  fontSize: "0.875rem",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.8125rem",
  fontWeight: 500,
  color: "var(--sl-silver)",
  marginBottom: "0.375rem",
};

const buttonBase: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.25rem",
  padding: "0.4375rem 0.875rem",
  borderRadius: "0.375rem",
  fontSize: "0.875rem",
  fontWeight: 500,
  cursor: "pointer",
  border: "none",
};

// ---------------------------------------------------------------------------
// Modal overlay
// ---------------------------------------------------------------------------

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(14,12,15,0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        padding: "1rem",
      }}
    >
      <div
        style={{
          backgroundColor: "var(--surface-panel)",
          border: "1px solid var(--border-dark)",
          borderRadius: "0.75rem",
          padding: "1.5rem",
          width: "100%",
          maxWidth: "32rem",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1.25rem",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "1.25rem",
              fontWeight: 700,
              color: "var(--sl-cream)",
            }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--sl-silver)",
              cursor: "pointer",
              fontSize: "1.25rem",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Create Tier form
// ---------------------------------------------------------------------------

function CreateTierForm({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createTierAction({ name, description: description || null });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onClose();
      router.refresh();
      if (result.id) router.push(`/admin/tiers/${result.id}`);
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: "1rem" }}>
        <label style={labelStyle}>Tier name *</label>
        <input
          style={inputStyle}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="e.g. Gold Partner"
        />
      </div>
      <div style={{ marginBottom: "1.25rem" }}>
        <label style={labelStyle}>Description</label>
        <input
          style={inputStyle}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description"
        />
      </div>
      {error && (
        <p style={{ color: "#f87171", fontSize: "0.875rem", marginBottom: "1rem" }}>{error}</p>
      )}
      <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
        <button type="button" onClick={onClose} style={{ ...buttonBase, color: "var(--sl-silver)", backgroundColor: "transparent" }}>
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          style={{
            ...buttonBase,
            backgroundColor: "var(--sl-lavender)",
            color: "var(--sl-obsidian)",
            opacity: isPending ? 0.7 : 1,
          }}
        >
          {isPending ? "Creating…" : "Create Tier"}
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Edit Tier form
// ---------------------------------------------------------------------------

function EditTierForm({
  tierId,
  initialName,
  initialDescription,
  onClose,
}: {
  tierId: string;
  initialName: string;
  initialDescription: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updateTierAction({ tierId, name, description: description || null });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onClose();
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: "1rem" }}>
        <label style={labelStyle}>Tier name *</label>
        <input
          style={inputStyle}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div style={{ marginBottom: "1.25rem" }}>
        <label style={labelStyle}>Description</label>
        <input
          style={inputStyle}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      {error && (
        <p style={{ color: "#f87171", fontSize: "0.875rem", marginBottom: "1rem" }}>{error}</p>
      )}
      <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
        <button type="button" onClick={onClose} style={{ ...buttonBase, color: "var(--sl-silver)", backgroundColor: "transparent" }}>
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          style={{
            ...buttonBase,
            backgroundColor: "var(--sl-lavender)",
            color: "var(--sl-obsidian)",
            opacity: isPending ? 0.7 : 1,
          }}
        >
          {isPending ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Deactivate Tier confirm
// ---------------------------------------------------------------------------

function DeactivateTierConfirm({
  tierId,
  partnerCount,
  onClose,
}: {
  tierId: string;
  partnerCount: number;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await deactivateTierAction(tierId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onClose();
      router.push("/admin/tiers");
    });
  }

  return (
    <div>
      <p style={{ color: "var(--sl-silver)", fontSize: "0.9375rem", marginBottom: "1rem" }}>
        Deactivate this tier? Partners already assigned will retain their tier assignment but the
        tier will no longer be selectable for new partners.
      </p>
      {partnerCount > 0 && (
        <p style={{ color: "#f87171", fontSize: "0.875rem", marginBottom: "1rem" }}>
          This tier currently has {partnerCount} partner{partnerCount !== 1 ? "s" : ""} assigned.
          Reassign them before deactivating.
        </p>
      )}
      {error && (
        <p style={{ color: "#f87171", fontSize: "0.875rem", marginBottom: "1rem" }}>{error}</p>
      )}
      <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
        <button type="button" onClick={onClose} style={{ ...buttonBase, color: "var(--sl-silver)", backgroundColor: "transparent" }}>
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={isPending || partnerCount > 0}
          style={{
            ...buttonBase,
            backgroundColor: partnerCount > 0 ? "rgba(107,101,112,0.4)" : "#dc2626",
            color: partnerCount > 0 ? "var(--sl-mid-gray)" : "#fff",
            cursor: partnerCount > 0 ? "not-allowed" : "pointer",
            opacity: isPending ? 0.7 : 1,
          }}
        >
          {isPending ? "Deactivating…" : "Deactivate Tier"}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Add Commission Rule form
// ---------------------------------------------------------------------------

function AddRuleForm({ tierId, onClose }: { tierId: string; onClose: () => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [productCode, setProductCode] = useState("ARIES_AI");
  const [packageCode, setPackageCode] = useState("");
  const [kind, setKind] = useState<"UPFRONT" | "TRAILING">("UPFRONT");
  const [percentBps, setPercentBps] = useState("");
  const [flatCents, setFlatCents] = useState("");
  const [trailingMonths, setTrailingMonths] = useState("");
  const [payoutDelay, setPayoutDelay] = useState("30");
  const [clawbackWindow, setClawbackWindow] = useState("90");
  const [quarterlyMin, setQuarterlyMin] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createCommissionRuleAction({
        tierId,
        productCode,
        packageCode: packageCode || null,
        kind,
        percentBps: percentBps ? Math.round(parseFloat(percentBps) * 100) : null,
        flatAmountCents: flatCents ? Math.round(parseFloat(flatCents) * 100) : null,
        trailingMonths: trailingMonths ? parseInt(trailingMonths, 10) : null,
        payoutDelayDays: parseInt(payoutDelay, 10) || 30,
        clawbackWindowDays: parseInt(clawbackWindow, 10) || 90,
        quarterlyMinReferrals: quarterlyMin ? parseInt(quarterlyMin, 10) : null,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onClose();
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
        <div>
          <label style={labelStyle}>Product code *</label>
          <input style={inputStyle} value={productCode} onChange={(e) => setProductCode(e.target.value)} required />
        </div>
        <div>
          <label style={labelStyle}>Package code</label>
          <input style={inputStyle} value={packageCode} onChange={(e) => setPackageCode(e.target.value)} placeholder="Optional" />
        </div>
        <div>
          <label style={labelStyle}>Kind *</label>
          <select
            style={{ ...inputStyle }}
            value={kind}
            onChange={(e) => setKind(e.target.value as "UPFRONT" | "TRAILING")}
          >
            <option value="UPFRONT">Upfront</option>
            <option value="TRAILING">Trailing</option>
          </select>
        </div>
        {kind === "TRAILING" && (
          <div>
            <label style={labelStyle}>Trailing months</label>
            <input style={inputStyle} type="number" value={trailingMonths} onChange={(e) => setTrailingMonths(e.target.value)} placeholder="e.g. 12" />
          </div>
        )}
        <div>
          <label style={labelStyle}>Rate % (e.g. 10 for 10%)</label>
          <input style={inputStyle} type="number" step="0.01" value={percentBps} onChange={(e) => setPercentBps(e.target.value)} placeholder="Leave blank for flat" />
        </div>
        <div>
          <label style={labelStyle}>Flat amount ($)</label>
          <input style={inputStyle} type="number" step="0.01" value={flatCents} onChange={(e) => setFlatCents(e.target.value)} placeholder="Leave blank for %" />
        </div>
        <div>
          <label style={labelStyle}>Payout delay (days)</label>
          <input style={inputStyle} type="number" value={payoutDelay} onChange={(e) => setPayoutDelay(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Clawback window (days)</label>
          <input style={inputStyle} type="number" value={clawbackWindow} onChange={(e) => setClawbackWindow(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Quarterly min referrals</label>
          <input style={inputStyle} type="number" value={quarterlyMin} onChange={(e) => setQuarterlyMin(e.target.value)} placeholder="Optional" />
        </div>
      </div>
      {error && (
        <p style={{ color: "#f87171", fontSize: "0.875rem", marginBottom: "1rem" }}>{error}</p>
      )}
      <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
        <button type="button" onClick={onClose} style={{ ...buttonBase, color: "var(--sl-silver)", backgroundColor: "transparent" }}>
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          style={{
            ...buttonBase,
            backgroundColor: "var(--sl-lavender)",
            color: "var(--sl-obsidian)",
            opacity: isPending ? 0.7 : 1,
          }}
        >
          {isPending ? "Adding…" : "Add Rule"}
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Deactivate Rule button (inline, no modal needed)
// ---------------------------------------------------------------------------

function DeactivateRuleButton({ ruleId }: { ruleId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    if (!confirm("Deactivate this commission rule?")) return;
    setError(null);
    startTransition(async () => {
      const result = await deactivateCommissionRuleAction(ruleId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={isPending}
        style={{
          ...buttonBase,
          backgroundColor: "transparent",
          color: "var(--sl-mid-gray)",
          border: "1px solid var(--border-dark)",
          opacity: isPending ? 0.7 : 1,
        }}
      >
        {isPending ? "…" : "Deactivate"}
      </button>
      {error && (
        <p style={{ color: "#f87171", fontSize: "0.75rem", marginTop: "0.25rem" }}>{error}</p>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// TierRuleEditor — polymorphic entry point
// ---------------------------------------------------------------------------

type TierRuleEditorProps =
  | { mode: "create" }
  | { mode: "edit"; tierId: string; initialName: string; initialDescription: string }
  | { mode: "deactivate"; tierId: string; partnerCount: number }
  | { mode: "add-rule"; tierId: string }
  | { mode: "deactivate-rule"; ruleId: string };

export default function TierRuleEditor(props: TierRuleEditorProps) {
  const [open, setOpen] = useState(false);

  if (props.mode === "deactivate-rule") {
    return <DeactivateRuleButton ruleId={props.ruleId} />;
  }

  const triggerLabel =
    props.mode === "create"
      ? "+ New Tier"
      : props.mode === "edit"
        ? "Edit"
        : props.mode === "deactivate"
          ? "Deactivate"
          : "+ Add Rule";

  const triggerStyle: React.CSSProperties =
    props.mode === "deactivate"
      ? { ...buttonBase, backgroundColor: "transparent", color: "#f87171", border: "1px solid rgba(248,113,113,0.3)" }
      : props.mode === "create" || props.mode === "add-rule"
        ? { ...buttonBase, backgroundColor: "var(--sl-lavender)", color: "var(--sl-obsidian)" }
        : { ...buttonBase, backgroundColor: "transparent", color: "var(--sl-lavender)", border: "1px solid var(--border-dark)" };

  const modalTitle =
    props.mode === "create"
      ? "New Tier"
      : props.mode === "edit"
        ? "Edit Tier"
        : props.mode === "deactivate"
          ? "Deactivate Tier"
          : "Add Commission Rule";

  return (
    <>
      <button onClick={() => setOpen(true)} style={triggerStyle}>
        {triggerLabel}
      </button>
      {open && (
        <Modal title={modalTitle} onClose={() => setOpen(false)}>
          {props.mode === "create" && <CreateTierForm onClose={() => setOpen(false)} />}
          {props.mode === "edit" && (
            <EditTierForm
              tierId={props.tierId}
              initialName={props.initialName}
              initialDescription={props.initialDescription}
              onClose={() => setOpen(false)}
            />
          )}
          {props.mode === "deactivate" && (
            <DeactivateTierConfirm
              tierId={props.tierId}
              partnerCount={props.partnerCount}
              onClose={() => setOpen(false)}
            />
          )}
          {props.mode === "add-rule" && (
            <AddRuleForm tierId={props.tierId} onClose={() => setOpen(false)} />
          )}
        </Modal>
      )}
    </>
  );
}
