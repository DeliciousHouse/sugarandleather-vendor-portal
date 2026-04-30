import React from "react";
import { redirect } from "next/navigation";
import { getRequiredActivePartner } from "@/lib/auth";
import {
  getPartnerEarningsForPartner,
  summarisePartnerEarnings,
} from "@/domain/dashboard/queries";
import EditorialPageShell from "@/components/brand/EditorialPageShell";
import EarningsTimeline from "@/components/dashboard/EarningsTimeline";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Earnings · Partner · Sugar & Leather",
};

export default async function PartnerEarningsPage() {
  let actor: Awaited<ReturnType<typeof getRequiredActivePartner>>;
  try {
    actor = await getRequiredActivePartner();
  } catch {
    redirect("/login");
  }

  if (!actor.partnerId) {
    redirect("/partner/pending");
  }

  const events = await getPartnerEarningsForPartner(actor.partnerId);
  const summary = summarisePartnerEarnings(events);

  return (
    <EditorialPageShell
      sectionLabel="02 / Earnings"
      crumbs={[
        { label: "Partner", href: "/partner" },
        { label: "Earnings" },
      ]}
      eyebrow="Commission history"
      headline="Your earnings"
      subheadline="Across all closed deals"
      mainChildren={<EarningsTimeline events={events} summary={summary} />}
    />
  );
}
