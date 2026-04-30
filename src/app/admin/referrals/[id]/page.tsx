import React from "react";
import { notFound, redirect } from "next/navigation";
import { getRequiredAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAdminReferralById } from "@/domain/referrals/queries";
import EditorialPageShell from "@/components/brand/EditorialPageShell";
import EditorialField from "@/components/brand/EditorialField";
import AdminReferralPanel from "@/components/referrals/AdminReferralPanel";
import Button from "@/components/ui/Button";
import { approveReferralAction, rejectReferralAction } from "./actions";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

const textareaClass =
  "w-full bg-transparent py-2 font-body text-base text-[var(--sl-cream)] placeholder:text-[var(--sl-silver)]/50 focus:outline-none resize-y min-h-20";

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
    <form action={decide} className="flex flex-col gap-4 min-w-[18rem]">
      <input type="hidden" name="referralId" value={referralId} />
      <EditorialField
        label={decision === "approve" ? "Approval notes" : "Rejection notes"}
        htmlFor={`${decision}-adminNotes`}
      >
        <textarea
          name="adminNotes"
          rows={3}
          placeholder="Optional notes about this decision"
          className={textareaClass}
        />
      </EditorialField>
      <Button
        type="submit"
        variant={decision === "approve" ? "primary" : "danger"}
        size="sm"
      >
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
    id,
  );

  if (!referral) notFound();

  const isPendingReview = referral.status === "PENDING_REVIEW";
  const isDuplicateNoCredit =
    referral.attributionStatus === "DUPLICATE_NO_CREDIT";

  return (
    <EditorialPageShell
      sectionLabel="03 / Referral"
      crumbs={[
        { label: "Referrals", href: "/admin/referrals" },
        { label: referral.leadName },
      ]}
      eyebrow="Review"
      headline={referral.leadName}
      subheadline={`${referral.partnerId} · ${referral.status}`}
      mainChildren={
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
      }
    />
  );
}
