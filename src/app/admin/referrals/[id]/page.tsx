import React from "react";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getRequiredAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAdminReferralById } from "@/domain/referrals/queries";
import AdminReferralPanel from "@/components/referrals/AdminReferralPanel";
import Button from "@/components/ui/Button";
import { approveReferralAction, rejectReferralAction } from "./actions";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

function DecisionForm({
  referralId,
  decision,
}: {
  referralId: string;
  decision: "approve" | "reject";
}) {
  async function decide(formData: FormData) {
    "use server";
    const notes = formData.get("adminNotes") as string | null;
    const result =
      decision === "approve"
        ? await approveReferralAction(referralId, notes ?? undefined)
        : await rejectReferralAction(referralId, notes ?? undefined);
    if (result.ok) {
      redirect("/admin/referrals");
    }
  }

  return (
    <form
      action={decide}
      style={{
        display: "grid",
        gap: "0.75rem",
        minWidth: "min(100%, 18rem)",
      }}
    >
      <input type="hidden" name="referralId" value={referralId} />
      <label
        htmlFor={`${decision}-adminNotes`}
        style={{
          fontSize: "0.8125rem",
          fontWeight: 600,
          color: "var(--sl-cream)",
        }}
      >
        {decision === "approve" ? "Approval notes" : "Rejection notes"}
      </label>
      <textarea
        id={`${decision}-adminNotes`}
        name="adminNotes"
        rows={3}
        placeholder="Optional notes about this decision"
        style={{
          width: "100%",
          backgroundColor: "var(--surface-root)",
          border: "1px solid var(--border-dark)",
          borderRadius: "0.375rem",
          padding: "0.5rem 0.75rem",
          color: "var(--sl-cream)",
          fontSize: "0.9375rem",
          resize: "vertical",
        }}
      />
      <Button type="submit" variant={decision === "approve" ? "primary" : "danger"}>
        {decision === "approve" ? "Approve" : "Reject"}
      </Button>
    </form>
  );
}

export default async function AdminReferralDetailPage({ params }: PageProps) {
  try {
    await getRequiredAdmin();
  } catch {
    redirect("/login");
  }

  const { id } = await params;
  const referral = await getAdminReferralById(
    prisma as unknown as Parameters<typeof getAdminReferralById>[0],
    id
  );

  if (!referral) notFound();

  const isPendingReview = referral.status === "PENDING_REVIEW";
  const isDuplicateNoCredit = referral.attributionStatus === "DUPLICATE_NO_CREDIT";

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--surface-root)",
        padding: "2rem",
      }}
    >
      <div style={{ maxWidth: "48rem", margin: "0 auto" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <Link
            href="/admin/referrals"
            style={{
              fontSize: "0.875rem",
              color: "var(--sl-lavender)",
              textDecoration: "none",
            }}
          >
            ← Back to referrals
          </Link>
        </div>

        <h1
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "2rem",
            fontWeight: 700,
            color: "var(--sl-cream)",
            marginBottom: "1.5rem",
          }}
        >
          Review referral
        </h1>

        <AdminReferralPanel
          referral={referral}
          approveAction={
            isPendingReview && !isDuplicateNoCredit ? (
              <DecisionForm referralId={referral.id} decision="approve" />
            ) : undefined
          }
          rejectAction={
            isPendingReview ? (
              <DecisionForm referralId={referral.id} decision="reject" />
            ) : undefined
          }
        />
      </div>
    </div>
  );
}
