import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import QuarterlyActivityCard, {
  type QuarterlyActivityCardProps,
} from "@/components/activity/QuarterlyActivityCard";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const baseActivity = {
  referralsSubmitted: 8,
  referralsApproved: 5,
  dealsWon: 2,
  revenueCents: 100000,
  commissionCents: 10000,
};

const noRequirementCompliance = {
  meetsRequirements: true,
  minimumReferralsRequired: null,
  referralsApproved: 5,
};

const meetsCompliance = {
  meetsRequirements: true,
  minimumReferralsRequired: 5,
  referralsApproved: 5,
};

const belowCompliance = {
  meetsRequirements: false,
  minimumReferralsRequired: 10,
  referralsApproved: 5,
};

function render$(props: Partial<QuarterlyActivityCardProps> = {}) {
  const defaults: QuarterlyActivityCardProps = {
    quarter: "2025-Q1",
    activity: baseActivity,
    tierCompliance: noRequirementCompliance,
    snapshot: null,
  };
  return render(<QuarterlyActivityCard {...defaults} {...props} />);
}

// ---------------------------------------------------------------------------
// Metric display
// ---------------------------------------------------------------------------

describe("QuarterlyActivityCard metrics", () => {
  it("renders the quarter label", () => {
    render$({ quarter: "2025-Q3" });
    expect(screen.getByText("2025-Q3")).toBeInTheDocument();
  });

  it("renders all 5 metric values", () => {
    render$();
    expect(screen.getByText("8")).toBeInTheDocument();  // referralsSubmitted
    expect(screen.getByText("5")).toBeInTheDocument();  // referralsApproved
    expect(screen.getByText("2")).toBeInTheDocument();  // dealsWon
    expect(screen.getByText("$1,000")).toBeInTheDocument(); // revenueCents
    expect(screen.getByText("$100")).toBeInTheDocument();   // commissionCents
  });
});

// ---------------------------------------------------------------------------
// Tier compliance states
// ---------------------------------------------------------------------------

describe("QuarterlyActivityCard tier compliance", () => {
  it("shows 'No minimum referral requirement' when minimumReferralsRequired is null", () => {
    render$({ tierCompliance: noRequirementCompliance });
    expect(screen.getByText(/no minimum referral requirement/i)).toBeInTheDocument();
  });

  it("shows 'Meets requirements' when meetsRequirements is true and minimum is set", () => {
    render$({ tierCompliance: meetsCompliance });
    expect(screen.getByText(/meets requirements/i)).toBeInTheDocument();
  });

  it("shows below-minimum message with correct numbers", () => {
    render$({ tierCompliance: belowCompliance });
    expect(screen.getByText(/below minimum/i)).toBeInTheDocument();
    expect(screen.getByText(/10 required/i)).toBeInTheDocument();
    expect(screen.getByText(/5 approved/i)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Override badge
// ---------------------------------------------------------------------------

describe("QuarterlyActivityCard override display", () => {
  it("does not render override badge when snapshot is null", () => {
    render$({ snapshot: null });
    expect(screen.queryByText(/override:/i)).not.toBeInTheDocument();
  });

  it("does not render override badge when overrideStatus is null", () => {
    render$({ snapshot: { overrideStatus: null, overrideReason: null } });
    expect(screen.queryByText(/override:/i)).not.toBeInTheDocument();
  });

  it("renders override badge with status when overrideStatus is set", () => {
    render$({ snapshot: { overrideStatus: "PROBATION", overrideReason: "Below target" } });
    expect(screen.getByText(/override: PROBATION/i)).toBeInTheDocument();
  });

  it("renders override reason when present", () => {
    render$({
      snapshot: { overrideStatus: "ACTIVE", overrideReason: "Manual waiver granted" },
    });
    expect(screen.getByText(/manual waiver granted/i)).toBeInTheDocument();
  });

  it("does not render override reason section when overrideReason is null", () => {
    render$({ snapshot: { overrideStatus: "ACTIVE", overrideReason: null } });
    expect(screen.queryByText(/override reason/i)).not.toBeInTheDocument();
  });
});
