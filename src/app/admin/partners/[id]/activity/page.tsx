import React from "react";
import { redirect } from "next/navigation";
import { getRequiredAdmin } from "@/lib/auth";
import { getPartnerQuarterlyActivityDashboard } from "@/domain/activity/queries";
import type { SessionUser } from "@/lib/access-control";
import QuarterlyActivityCard from "@/components/activity/QuarterlyActivityCard";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Quarter helpers
// ---------------------------------------------------------------------------

function currentQuarter(): string {
  const now = new Date();
  const q = Math.ceil((now.getMonth() + 1) / 3);
  return `${now.getFullYear()}-Q${q}`;
}

// Returns [current, prev1, ..., prevCount] — (count + 1) quarters total, newest first.
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

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

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

  // Compute data for current quarter and previous 3 (4 total)
  const quarters = buildRecentQuarters(currentQuarter(), 3);
  const { partner, quarterData } = await getPartnerQuarterlyActivityDashboard(
    partnerId,
    quarters,
    session
  );

  if (!partner) {
    redirect("/admin/partners");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--surface-root)",
        padding: "2rem",
      }}
    >
      <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
        <div style={{ marginBottom: "2rem" }}>
          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "2rem",
              fontWeight: 700,
              color: "var(--sl-cream)",
              marginBottom: "0.25rem",
            }}
          >
            Quarterly Activity
          </h1>
          <p style={{ fontSize: "0.9375rem", color: "var(--sl-silver)" }}>
            Partner ID: {partnerId}
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(20rem, 1fr))",
            gap: "1.5rem",
          }}
        >
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
      </div>
    </div>
  );
}
