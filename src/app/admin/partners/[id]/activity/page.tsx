import React from "react";
import { redirect } from "next/navigation";
import { getRequiredAdmin } from "@/lib/auth";
import { getPartnerQuarterlyActivityDashboard } from "@/domain/activity/queries";
import type { SessionUser } from "@/lib/access-control";
import EditorialPageShell from "@/components/brand/EditorialPageShell";
import QuarterlyActivityCard from "@/components/activity/QuarterlyActivityCard";

export const dynamic = "force-dynamic";

function currentQuarter(): string {
  const now = new Date();
  const q = Math.ceil((now.getMonth() + 1) / 3);
  return `${now.getFullYear()}-Q${q}`;
}

function buildRecentQuarters(current: string, count: number): string[] {
  const [yearStr, qStr] = current.split("-Q");
  let year = parseInt(yearStr, 10);
  let q = parseInt(qStr, 10);
  const quarters: string[] = [current];
  for (let i = 0; i < count; i++) {
    q--;
    if (q === 0) {
      q = 4;
      year--;
    }
    quarters.push(`${year}-Q${q}`);
  }
  return quarters;
}

export default async function AdminPartnerActivityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  let session: SessionUser;
  try {
    session = await getRequiredAdmin();
  } catch {
    redirect("/login");
  }

  const { id: partnerId } = await params;

  const quarters = buildRecentQuarters(currentQuarter(), 3);
  const { partner, quarterData } = await getPartnerQuarterlyActivityDashboard(
    partnerId,
    quarters,
    session,
  );

  if (!partner) {
    redirect("/admin/partners");
  }

  return (
    <EditorialPageShell
      sectionLabel="03 / Partner activity"
      crumbs={[
        { label: "Admin", href: "/admin" },
        { label: partnerId },
      ]}
      eyebrow="Quarterly trail"
      headline="Partner activity"
      subheadline={`Partner ID · ${partnerId}`}
      mainChildren={
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2">
          {quarterData.map(({ quarter, activity, tierCompliance, snapshot }) => (
            <QuarterlyActivityCard
              key={quarter}
              quarter={quarter}
              activity={activity}
              tierCompliance={tierCompliance}
              snapshot={snapshot}
            />
          ))}
        </div>
      }
    />
  );
}
