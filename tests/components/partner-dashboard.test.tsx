import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import MetricCard from "@/components/dashboard/MetricCard";
import EarningsTimeline from "@/components/dashboard/EarningsTimeline";
import type { PartnerEarningsRow, PartnerEarningsSummary } from "@/domain/dashboard/queries";

// ---------------------------------------------------------------------------
// MetricCard
// ---------------------------------------------------------------------------

describe("MetricCard", () => {
  it("renders the label and value", () => {
    render(<MetricCard label="Total referrals" value={42} />);
    expect(screen.getByText("Total referrals")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders an optional sublabel", () => {
    render(<MetricCard label="Approved" value={10} sublabel="All time" />);
    expect(screen.getByText("All time")).toBeInTheDocument();
  });

  it("renders without sublabel when not provided", () => {
    render(<MetricCard label="Staged" value={5} />);
    expect(screen.queryByText("All time")).not.toBeInTheDocument();
  });

  it.each(["neutral", "success", "warning", "danger"] as const)(
    "renders %s variant without error",
    (variant) => {
      render(<MetricCard label="Label" value={1} variant={variant} />);
      expect(screen.getByText("Label")).toBeInTheDocument();
    }
  );

  it("renders as a link when href is provided", () => {
    render(<MetricCard label="Deals" value={3} href="/partner/deals" />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/partner/deals");
  });

  it("does not render a link when href is not provided", () => {
    render(<MetricCard label="Deals" value={3} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("renders zero value", () => {
    render(<MetricCard label="Lost" value={0} variant="neutral" />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// EarningsTimeline
// ---------------------------------------------------------------------------

const makeSummary = (overrides?: Partial<PartnerEarningsSummary>): PartnerEarningsSummary => ({
  STAGED: 10000,
  PAYABLE: 25000,
  PAID: 50000,
  CLAWED_BACK: 5000,
  currency: "USD",
  ...overrides,
});

const makeEvent = (overrides?: Partial<PartnerEarningsRow>): PartnerEarningsRow => ({
  id: "evt_1",
  dealId: "deal_1",
  kind: "UPFRONT",
  status: "PAID",
  amountCents: 50000,
  currency: "USD",
  tierNameSnapshot: "Affiliate",
  payoutEligibleAt: new Date("2025-03-01"),
  paidAt: new Date("2025-03-15"),
  periodStart: null,
  periodEnd: null,
  ...overrides,
});

describe("EarningsTimeline", () => {
  it("renders summary cards for all four statuses", () => {
    render(<EarningsTimeline events={[]} summary={makeSummary()} />);
    expect(screen.getAllByText("Staged").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Payable").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Paid").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Clawed back").length).toBeGreaterThan(0);
  });

  it("shows an empty state when there are no events", () => {
    render(<EarningsTimeline events={[]} summary={makeSummary()} />);
    expect(screen.getByText(/no commission events yet/i)).toBeInTheDocument();
  });

  it("renders event rows when events are provided", () => {
    const events = [
      makeEvent({ id: "evt_1", kind: "UPFRONT", status: "PAID", tierNameSnapshot: "Affiliate" }),
      makeEvent({ id: "evt_2", kind: "TRAILING", status: "PAYABLE", tierNameSnapshot: "Reseller" }),
    ];
    render(<EarningsTimeline events={events} summary={makeSummary()} />);
    expect(screen.getByText("Upfront")).toBeInTheDocument();
    expect(screen.getByText("Trailing")).toBeInTheDocument();
    expect(screen.getByText("Affiliate")).toBeInTheDocument();
    expect(screen.getByText("Reseller")).toBeInTheDocument();
  });

  it("shows a payout timing note", () => {
    render(<EarningsTimeline events={[]} summary={makeSummary()} />);
    expect(screen.getByText(/payout timing/i)).toBeInTheDocument();
  });

  it("shows clawback events with their status label", () => {
    const events = [makeEvent({ id: "evt_cb", kind: "CLAWBACK", status: "CLAWED_BACK" })];
    render(<EarningsTimeline events={events} summary={makeSummary()} />);
    // "Clawed back" appears in both the summary card and the event row
    expect(screen.getAllByText("Clawed back").length).toBeGreaterThan(0);
    // The kind label "Clawback" only appears in the event row
    expect(screen.getByText("Clawback")).toBeInTheDocument();
  });

  it("does not expose any admin-only note fields", () => {
    const events = [makeEvent()];
    const { container } = render(
      <EarningsTimeline events={events} summary={makeSummary()} />
    );
    expect(container.textContent).not.toMatch(/adminNotes/i);
    expect(container.textContent).not.toMatch(/reviewNotes/i);
    expect(container.textContent).not.toMatch(/admin notes/i);
  });

  it("shows a dash for paidAt when event is not yet paid", () => {
    const events = [makeEvent({ status: "STAGED", paidAt: null })];
    render(<EarningsTimeline events={events} summary={makeSummary()} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
