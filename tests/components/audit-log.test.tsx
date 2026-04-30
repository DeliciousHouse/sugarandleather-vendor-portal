import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import AuditLogTable, { type AuditLogRow } from "@/components/audit/AuditLogTable";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeRow(overrides?: Partial<AuditLogRow>): AuditLogRow {
  return {
    id: "audit_1",
    actorId: "user_admin_1",
    actorType: "USER",
    action: "DEAL_STATUS_UPDATED",
    entityType: "Deal",
    entityId: "deal_abc",
    before: { status: "OPEN" },
    after: { status: "WON" },
    reason: null,
    createdAt: new Date("2025-01-15T10:30:00Z"),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// AuditLogTable — rendering
// ---------------------------------------------------------------------------

describe("AuditLogTable", () => {
  it("renders the empty state when no rows are provided", () => {
    render(<AuditLogTable rows={[]} />);
    expect(screen.getByText("No audit events.")).toBeInTheDocument();
  });

  it("renders a custom empty message", () => {
    render(<AuditLogTable rows={[]} emptyMessage="Nothing here yet." />);
    expect(screen.getByText("Nothing here yet.")).toBeInTheDocument();
  });

  it("renders the action column for each row", () => {
    render(<AuditLogTable rows={[makeRow()]} />);
    expect(screen.getByText("DEAL_STATUS_UPDATED")).toBeInTheDocument();
  });

  it("renders the entity type and entity ID", () => {
    render(<AuditLogTable rows={[makeRow()]} />);
    expect(screen.getByText("Deal")).toBeInTheDocument();
    expect(screen.getByText("deal_abc")).toBeInTheDocument();
  });

  it("renders the actor ID for USER actor type", () => {
    render(<AuditLogTable rows={[makeRow({ actorId: "user_42" })]} />);
    expect(screen.getByText("user_42")).toBeInTheDocument();
  });

  it("renders 'system' for SYSTEM actor type", () => {
    render(
      <AuditLogTable rows={[makeRow({ actorType: "SYSTEM", actorId: null })]} />
    );
    expect(screen.getByText("system")).toBeInTheDocument();
  });

  it("renders the diff summary from before/after", () => {
    render(
      <AuditLogTable
        rows={[makeRow({ before: { status: "OPEN" }, after: { status: "WON" } })]}
      />
    );
    // Diff summary appears in summary element (also in the full JSON pre block)
    expect(screen.getAllByText(/status.*OPEN.*WON/i).length).toBeGreaterThan(0);
  });

  it("renders '—' diff summary when before and after are both null", () => {
    render(
      <AuditLogTable rows={[makeRow({ before: null, after: null })]} />
    );
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("renders the full JSON in a details disclosure element", () => {
    render(<AuditLogTable rows={[makeRow()]} />);
    const details = document.querySelector("details");
    expect(details).not.toBeNull();
    const pre = details?.querySelector("pre");
    expect(pre).not.toBeNull();
    expect(pre?.textContent).toContain('"before"');
    expect(pre?.textContent).toContain('"after"');
    expect(pre?.textContent).toContain('"status"');
  });

  it("renders multiple rows", () => {
    const rows = [
      makeRow({ id: "a1", action: "DEAL_CREATED" }),
      makeRow({ id: "a2", action: "DEAL_STATUS_UPDATED" }),
      makeRow({ id: "a3", action: "PARTNER_ACTIVATED" }),
    ];
    render(<AuditLogTable rows={rows} />);
    expect(screen.getByText("DEAL_CREATED")).toBeInTheDocument();
    expect(screen.getByText("DEAL_STATUS_UPDATED")).toBeInTheDocument();
    expect(screen.getByText("PARTNER_ACTIVATED")).toBeInTheDocument();
  });

  it("renders the reason when present", () => {
    render(<AuditLogTable rows={[makeRow({ reason: "Admin override" })]} />);
    expect(screen.getByText("Admin override")).toBeInTheDocument();
  });

  it("renders '—' for reason when absent", () => {
    render(<AuditLogTable rows={[makeRow({ reason: null })]} />);
    // At least one "—" should exist (reason column)
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("renders the timestamp as a time element", () => {
    render(<AuditLogTable rows={[makeRow()]} />);
    const timeEl = document.querySelector("time");
    expect(timeEl).not.toBeNull();
    expect(timeEl?.getAttribute("dateTime")).toBe("2025-01-15T10:30:00.000Z");
  });

  it("renders header columns", () => {
    render(<AuditLogTable rows={[]} />);
    expect(screen.getByText("Timestamp")).toBeInTheDocument();
    expect(screen.getByText("Actor")).toBeInTheDocument();
    expect(screen.getByText("Action")).toBeInTheDocument();
    expect(screen.getByText("Entity")).toBeInTheDocument();
    expect(screen.getByText("Changes")).toBeInTheDocument();
    expect(screen.getByText("Reason")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Diff summary edge cases
// ---------------------------------------------------------------------------

describe("AuditLogTable — diff summary", () => {
  it("shows 'No field changes' when before and after have identical values", () => {
    render(
      <AuditLogTable
        rows={[makeRow({ before: { status: "WON" }, after: { status: "WON" } })]}
      />
    );
    expect(screen.getByText("No field changes")).toBeInTheDocument();
  });

  it("truncates to first 3 changes with '+ N more' for large diffs", () => {
    const before = { a: 1, b: 2, c: 3, d: 4, e: 5 };
    const after = { a: 10, b: 20, c: 30, d: 40, e: 50 };
    render(<AuditLogTable rows={[makeRow({ before, after })]} />);
    expect(screen.getByText(/\+ 2 more/)).toBeInTheDocument();
  });
});
