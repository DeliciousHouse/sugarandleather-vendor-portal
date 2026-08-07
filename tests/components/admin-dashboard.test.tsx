import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import AdminWorkQueue from "@/components/dashboard/AdminWorkQueue";
import AdminRevenueSnapshotPanel from "@/components/dashboard/AdminRevenueSnapshot";
import type { AdminWorkQueueCounts, AdminRevenueSnapshot } from "@/domain/dashboard/queries";

// ---------------------------------------------------------------------------
// AdminWorkQueue
// ---------------------------------------------------------------------------

const makeQueueCounts = (overrides?: Partial<AdminWorkQueueCounts>): AdminWorkQueueCounts => ({
  applicationsPending: 3,
  agreementsPending: 1,
  referralsPending: 7,
  commissionsPayable: 2,
  payableAmountCents: 20000,
  ...overrides,
});

describe("AdminWorkQueue", () => {
  it("renders all four queue item labels", () => {
    render(<AdminWorkQueue counts={makeQueueCounts()} />);
    expect(screen.getByText(/applications pending review/i)).toBeInTheDocument();
    expect(screen.getByText(/agreements awaiting signature/i)).toBeInTheDocument();
    expect(screen.getByText(/referrals pending approval/i)).toBeInTheDocument();
    expect(screen.getByText(/payable commissions/i)).toBeInTheDocument();
  });

  it("renders non-zero counts as numbers", () => {
    render(<AdminWorkQueue counts={makeQueueCounts({ applicationsPending: 5 })} />);
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("renders zero counts with empty-state labels instead of '0'", () => {
    render(<AdminWorkQueue counts={makeQueueCounts({ applicationsPending: 0 })} />);
    expect(screen.getByText(/no applications pending/i)).toBeInTheDocument();
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("all items render as links to the correct admin pages", () => {
    render(<AdminWorkQueue counts={makeQueueCounts()} />);
    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/admin/applications?status=SUBMITTED");
    expect(hrefs).toContain("/admin/agreements");
    expect(hrefs).toContain("/admin/referrals?status=PENDING_REVIEW");
    expect(hrefs).toContain("/admin/payouts");
  });

  it("renders all counts correctly when all are non-zero", () => {
    render(
      <AdminWorkQueue
        counts={{
          applicationsPending: 3,
          agreementsPending: 1,
          referralsPending: 7,
          commissionsPayable: 2,
          payableAmountCents: 20000,
        }}
      />
    );
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("renders empty states for all zeroed counts", () => {
    render(
      <AdminWorkQueue
        counts={{
          applicationsPending: 0,
          agreementsPending: 0,
          referralsPending: 0,
          commissionsPayable: 0,
          payableAmountCents: 0,
        }}
      />
    );
    expect(screen.getByText(/no applications pending/i)).toBeInTheDocument();
    expect(screen.getByText(/no agreements awaiting/i)).toBeInTheDocument();
    expect(screen.getByText(/no referrals pending/i)).toBeInTheDocument();
    expect(screen.getByText(/no payable commissions/i)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// AdminRevenueSnapshotPanel
// ---------------------------------------------------------------------------

const makeSnapshot = (overrides?: Partial<AdminRevenueSnapshot>): AdminRevenueSnapshot => ({
  totalDealsWon: 12,
  totalRevenueCents: 1500000,
  totalCommissionCents: 225000,
  currency: "USD",
  ...overrides,
});

describe("AdminRevenueSnapshotPanel", () => {
  it("renders the three metric labels", () => {
    render(<AdminRevenueSnapshotPanel snapshot={makeSnapshot()} />);
    expect(screen.getByText(/deals won/i)).toBeInTheDocument();
    expect(screen.getByText(/total revenue/i)).toBeInTheDocument();
    expect(screen.getByText(/total commissions/i)).toBeInTheDocument();
  });

  it("renders the deals won count", () => {
    render(<AdminRevenueSnapshotPanel snapshot={makeSnapshot({ totalDealsWon: 8 })} />);
    expect(screen.getByText("8")).toBeInTheDocument();
  });

  it("renders formatted revenue figure", () => {
    render(<AdminRevenueSnapshotPanel snapshot={makeSnapshot({ totalRevenueCents: 1500000 })} />);
    expect(screen.getByText("$15,000")).toBeInTheDocument();
  });

  it("renders formatted commission figure", () => {
    render(<AdminRevenueSnapshotPanel snapshot={makeSnapshot({ totalCommissionCents: 225000 })} />);
    expect(screen.getByText("$2,250")).toBeInTheDocument();
  });

  it("renders zero values gracefully", () => {
    render(
      <AdminRevenueSnapshotPanel
        snapshot={{ totalDealsWon: 0, totalRevenueCents: 0, totalCommissionCents: 0, currency: "USD" }}
      />
    );
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getAllByText("$0")).toHaveLength(2);
  });
});
