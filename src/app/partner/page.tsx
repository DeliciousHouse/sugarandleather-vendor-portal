import React from "react";
import { redirect } from "next/navigation";
import { getRequiredActivePartner } from "@/lib/auth";
import { getPartnerReferralStatusCountsForPartner } from "@/domain/dashboard/queries";
import EditorialShell, {
  AccentSection,
  EmptyQueueRow,
  QueueRow,
  pluralize,
  spellOrNumber,
} from "@/components/brand/EditorialShell";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard · Partner · Sugar & Leather",
};

export default async function PartnerDashboardPage() {
  let actor: Awaited<ReturnType<typeof getRequiredActivePartner>>;
  try {
    actor = await getRequiredActivePartner();
  } catch {
    redirect("/login");
  }

  if (!actor.partnerId) {
    redirect("/partner/pending");
  }

  const counts = await getPartnerReferralStatusCountsForPartner(actor.partnerId);

  const total = counts.total;
  const converted = counts.CONVERTED;
  const pending = counts.PENDING_REVIEW;
  const approved = counts.APPROVED;

  const headlineParts: React.ReactNode[] = [];
  if (total > 0) {
    headlineParts.push(
      `${spellOrNumber(total, { capitalize: true })} ${pluralize(total, "referral")}`,
    );
  }
  if (converted > 0) {
    headlineParts.push(
      `${spellOrNumber(converted, {
        capitalize: headlineParts.length === 0,
      })} ${pluralize(converted, "deal")} closed`,
    );
  }
  if (pending > 0) {
    headlineParts.push(
      <>
        {spellOrNumber(pending, { capitalize: headlineParts.length === 0 })} still in{" "}
        <span className="relative inline-block">
          motion
          <span
            aria-hidden
            className="absolute -bottom-2 left-0 h-[3px] w-full bg-[var(--sl-lavender)]"
          />
        </span>
      </>,
    );
  }

  const headlineNode: React.ReactNode =
    headlineParts.length === 0 ? (
      <>
        Welcome. Submit your first{" "}
        <span className="relative inline-block">
          referral
          <span
            aria-hidden
            className="absolute -bottom-2 left-0 h-[3px] w-full bg-[var(--sl-lavender)]"
          />
        </span>
      </>
    ) : headlineParts.length === 1 ? (
      <>{headlineParts[0]}</>
    ) : (
      <>
        {headlineParts.slice(0, -1).map((p, i) => (
          <span key={i}>
            {p}
            {i < headlineParts.length - 2 ? ", " : ", and "}
          </span>
        ))}
        {headlineParts[headlineParts.length - 1]}
      </>
    );

  const bodyLines: string[] = [];
  if (approved > 0)
    bodyLines.push(
      `${approved} ${pluralize(approved, "referral")} approved, ready for the deal stage.`,
    );
  if (counts.LOST > 0 || counts.REJECTED > 0) {
    const lost = counts.LOST + counts.REJECTED;
    bodyLines.push(
      `${lost} closed without conversion this period.`,
    );
  }
  if (bodyLines.length === 0)
    bodyLines.push(
      "Submit a referral and we'll handle the rest. No automated funnel, no follow-up scripts.",
    );

  const partnerLabel = "Authorized partner";

  return (
    <EditorialShell
      topLeftLabel="Sugar & Leather AI"
      topRightLabel="01 / Partner"
      eyebrow="Your activity"
      headline={headlineNode}
      body={<p>{bodyLines.join(" ")}</p>}
      footerRight={partnerLabel.toUpperCase()}
      rightLabel="02 / At a glance"
      rightHeadline="This period"
      rightChildren={
        <>
          <AccentSection
            eyebrow={`In review · ${pending}`}
            eyebrowAccent={pending > 0}
          >
            {pending === 0 ? (
              <EmptyQueueRow note="Nothing waiting on us." />
            ) : (
              <QueueRow
                category="Pending review"
                title={`${pending} ${pluralize(pending, "referral")}`}
                meta="Typical review window: 2–3 business days"
              />
            )}
          </AccentSection>

          <AccentSection eyebrow={`Approved · ${approved}`}>
            {approved === 0 ? (
              <EmptyQueueRow note="None at the moment." />
            ) : (
              <QueueRow
                category="Ready for outreach"
                title={`${approved} ${pluralize(approved, "referral")}`}
                meta="Move to deal stage when contact is warm"
              />
            )}
          </AccentSection>

          <AccentSection eyebrow={`Closed · ${converted}`}>
            {converted === 0 ? (
              <EmptyQueueRow note="No deals closed yet this period." />
            ) : (
              <QueueRow
                category="Converted"
                title={`${converted} ${pluralize(converted, "deal")} closed`}
                meta="Commission stages on the next payout cycle"
              />
            )}
          </AccentSection>
        </>
      }
      rightFooter={{ href: "/partner/referrals", label: "Open all referrals" }}
    />
  );
}
