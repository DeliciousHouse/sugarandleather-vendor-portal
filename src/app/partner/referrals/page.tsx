import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getRequiredActivePartner } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPartnerReferrals } from "@/domain/referrals/queries";
import ReferralStatusTable from "@/components/referrals/ReferralStatusTable";
import Button from "@/components/ui/Button";

export const dynamic = "force-dynamic";

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

  const referrals = await getPartnerReferrals(
    prisma as unknown as Parameters<typeof getPartnerReferrals>[0],
    actor.partnerId
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--surface-root)",
        padding: "2rem",
      }}
    >
      <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "2rem",
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "2rem",
                fontWeight: 700,
                color: "var(--sl-cream)",
                marginBottom: "0.25rem",
              }}
            >
              My referrals
            </h1>
            <p style={{ fontSize: "0.9375rem", color: "var(--sl-silver)" }}>
              Referrals are counted only after admin approval.
            </p>
          </div>
          <Link href="/partner/referrals/new">
            <Button>Submit referral</Button>
          </Link>
        </div>

        <ReferralStatusTable referrals={referrals} />
      </div>
    </div>
  );
}
