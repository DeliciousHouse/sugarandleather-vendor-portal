import React from "react";
import { redirect } from "next/navigation";
import { getRequiredActivePartner } from "@/lib/auth";
import {
  getPartnerEarningsForPartner,
  summarisePartnerEarnings,
} from "@/domain/dashboard/queries";
import EarningsTimeline from "@/components/dashboard/EarningsTimeline";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Earnings — Partner — Sugar & Leather",
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
    <main
      className="min-h-screen py-10 px-6"
      style={{ backgroundColor: "var(--surface-root)" }}
    >
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "2rem",
              fontWeight: 700,
              color: "var(--sl-cream)",
              marginBottom: "0.25rem",
            }}
          >
            My earnings
          </h1>
          <p style={{ fontSize: "0.9375rem", color: "var(--sl-silver)" }}>
            Commission history across all your deals.
          </p>
        </div>

        <EarningsTimeline events={events} summary={summary} />
      </div>
    </main>
  );
}
