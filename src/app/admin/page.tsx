import React from "react";
import { redirect } from "next/navigation";
import { getRequiredAdmin } from "@/lib/auth";
import {
  getAdminDashboardWorkQueueCounts,
  getAdminDashboardRecentAuditEvents,
  getAdminDashboardRevenueSnapshot,
} from "@/domain/dashboard/queries";
import EditorialShell, {
  AccentSection,
  EmptyQueueRow,
  QueueRow,
  pluralize,
  spellOrNumber,
} from "@/components/brand/EditorialShell";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin overview · Sugar & Leather",
};

const dollars = (cents: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Math.round(cents / 100));

export default async function AdminDashboardPage() {
  try {
    await getRequiredAdmin();
  } catch {
    redirect("/login");
  }

  const [counts, snapshot, auditEvents] = await Promise.all([
    getAdminDashboardWorkQueueCounts(),
    getAdminDashboardRevenueSnapshot(),
    getAdminDashboardRecentAuditEvents({ take: 4 }),
  ]);

  const apps = counts.applicationsPending;
  const agreements = counts.agreementsPending;
  const payouts = counts.commissionsPayable;
  const referrals = counts.referralsPending;

  const headlineParts: React.ReactNode[] = [];
  if (apps > 0) {
    headlineParts.push(
      `${spellOrNumber(apps, { capitalize: headlineParts.length === 0 })} ${pluralize(
        apps,
        "application",
      )}`,
    );
  }
  if (agreements > 0) {
    headlineParts.push(
      `${spellOrNumber(agreements, { capitalize: headlineParts.length === 0 })} ${pluralize(
        agreements,
        "agreement",
      )}`,
    );
  }
  if (payouts > 0) {
    headlineParts.push(
      <>
        {spellOrNumber(payouts, { capitalize: headlineParts.length === 0 })}{" "}
        {pluralize(payouts, "payout")} to{" "}
        <span className="relative inline-block">
          release
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
      <>The queue is clear, for now</>
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
  if (referrals > 0)
    bodyLines.push(
      `${spellOrNumber(referrals, { capitalize: true })} ${pluralize(
        referrals,
        "referral",
      )} ${pluralize(referrals, "needs", "need")} review.`,
    );
  if (snapshot.totalDealsWon > 0)
    bodyLines.push(
      `${dollars(snapshot.totalRevenueCents, snapshot.currency)} closed lifetime, ${dollars(
        snapshot.totalCommissionCents,
        snapshot.currency,
      )} in commission across ${snapshot.totalDealsWon} ${pluralize(
        snapshot.totalDealsWon,
        "deal",
      )}.`,
    );
  if (bodyLines.length === 0)
    bodyLines.push(
      "Quiet week. Nothing pending review, nothing to release. Use the time well.",
    );

  return (
    <EditorialShell
      topLeftLabel="Sugar & Leather AI"
      topRightLabel="01 / Admin"
      eyebrow="Today's queue"
      headline={headlineNode}
      body={
        <p>
          {bodyLines.join(" ")}
        </p>
      }
      footerRight="Internal use · Authorized admins"
      rightLabel="02 / Today"
      rightHeadline="At a glance"
      rightChildren={
        <>
          <AccentSection
            eyebrow={`New applications · ${apps}`}
            eyebrowAccent={apps > 0}
          >
            {apps === 0 ? (
              <EmptyQueueRow note="None pending. Inbox is clear." />
            ) : (
              <QueueRow
                category="Applications"
                title={`${apps} ${pluralize(apps, "partner")} awaiting review`}
                meta="Open queue to triage"
              />
            )}
          </AccentSection>

          <AccentSection eyebrow={`Agreements pending signature · ${agreements}`}>
            {agreements === 0 ? (
              <EmptyQueueRow note="No outstanding signatures." />
            ) : (
              <QueueRow
                category="Agreements"
                title={`${agreements} awaiting countersign`}
                meta="Send reminders or escalate"
              />
            )}
          </AccentSection>

          <AccentSection eyebrow={`Payouts ready · ${payouts}`}>
            {payouts === 0 ? (
              <EmptyQueueRow note="Nothing staged this cycle." />
            ) : (
              <QueueRow
                category="Payouts"
                title={`${dollars(snapshot.totalCommissionCents, snapshot.currency)} in commission`}
                meta={`${payouts} ${pluralize(payouts, "event")} payable`}
              />
            )}
          </AccentSection>

          {auditEvents.length > 0 ? (
            <AccentSection eyebrow="Last actions">
              {auditEvents.map((event) => (
                <div
                  key={event.id}
                  className="border-b border-[var(--border-dark)] py-3 last:border-b-0"
                >
                  <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--sl-silver)]">
                    {event.action} · {event.entityType}
                  </p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--sl-silver)]/70">
                    {event.createdAt.toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              ))}
            </AccentSection>
          ) : null}
        </>
      }
      rightFooter={{ href: "/admin/applications", label: "Open queue" }}
    />
  );
}
