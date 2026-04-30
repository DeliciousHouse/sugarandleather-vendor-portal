import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getRequiredActivePartner } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPartnerReferrals } from "@/domain/referrals/queries";
import { getPartnerReferralStatusCountsForPartner } from "@/domain/dashboard/queries";
import EditorialPageShell from "@/components/brand/EditorialPageShell";
import ReferralStatusTable from "@/components/referrals/ReferralStatusTable";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Referrals · Partner · Sugar & Leather",
};

export default async function PartnerReferralsPage() {
  let actor: Awaited<ReturnType<typeof getRequiredActivePartner>>;
  try {
    actor = await getRequiredActivePartner();
  } catch {
    redirect("/login");
  }

  if (!actor.partnerId) {
    redirect("/partner/pending");
  }

  const [referrals, counts] = await Promise.all([
    getPartnerReferrals(
      prisma as unknown as Parameters<typeof getPartnerReferrals>[0],
      actor.partnerId,
    ),
    getPartnerReferralStatusCountsForPartner(actor.partnerId),
  ]);

  // Aggregate counts across ALL referrals (not just the displayed page).
  const total = counts.total;
  const pending = counts.PENDING_REVIEW;
  const converted = counts.CONVERTED;
  const showing = referrals.length;
  const hasMore = total > showing;

  return (
    <EditorialPageShell
      sectionLabel="02 / Referrals"
      crumbs={[
        { label: "Partner", href: "/partner" },
        { label: "Referrals" },
      ]}
      eyebrow="Your activity"
      headline={
        <>
          {total === 0 ? (
            "No referrals yet"
          ) : (
            <>
              {total} {total === 1 ? "referral" : "referrals"}
            </>
          )}
        </>
      }
      subheadline={
        total > 0
          ? `${pending} pending · ${converted} converted${hasMore ? ` · showing latest ${showing}` : ""}`
          : "Submit your first to begin."
      }
      actions={
        <Link
          href="/partner/referrals/new"
          className="group inline-flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--sl-cream)] hover:text-[var(--sl-lavender)] transition-colors"
        >
          <span>Begin referral</span>
          <span
            aria-hidden
            className="h-px w-10 bg-[var(--sl-cream)] transition-all group-hover:w-16 group-hover:bg-[var(--sl-lavender)]"
          />
        </Link>
      }
      mainChildren={<ReferralStatusTable referrals={referrals} />}
    />
  );
}
