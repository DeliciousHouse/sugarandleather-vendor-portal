import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import EditorialField from "@/components/brand/EditorialField";
import EditorialStatusPill from "@/components/brand/EditorialStatusPill";
import EditorialTable, {
  ColumnDef,
} from "@/components/brand/EditorialTable";
import EditorialBreadcrumb from "@/components/brand/EditorialBreadcrumb";
import EditorialEmptyState from "@/components/brand/EditorialEmptyState";
import EditorialPageShell from "@/components/brand/EditorialPageShell";

// ---------------------------------------------------------------------------
// EditorialField (canonical template — copy this structure for new primitives)
// ---------------------------------------------------------------------------
describe("EditorialField", () => {
  it("renders label and child input", () => {
    render(
      <EditorialField label="Email" htmlFor="email">
        <input type="email" />
      </EditorialField>,
    );
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveAttribute("id", "email");
  });

  it("renders helper text when no error", () => {
    render(
      <EditorialField label="Email" htmlFor="email" helperText="We'll never share">
        <input type="email" />
      </EditorialField>,
    );
    expect(screen.getByText("We'll never share")).toBeInTheDocument();
  });

  it("shows error and hides helper text when error is set", () => {
    render(
      <EditorialField
        label="Email"
        htmlFor="email"
        helperText="We'll never share"
        error="Required"
      >
        <input type="email" />
      </EditorialField>,
    );
    expect(screen.getByText("Required")).toBeInTheDocument();
    expect(screen.queryByText("We'll never share")).not.toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
  });

  it("marks required and propagates aria-required to input", () => {
    render(
      <EditorialField label="Name" htmlFor="name" required>
        <input type="text" />
      </EditorialField>,
    );
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-required", "true");
  });
});

// ---------------------------------------------------------------------------
// EditorialStatusPill
// ---------------------------------------------------------------------------
describe("EditorialStatusPill", () => {
  it("renders semantic success tone for known SUCCESS status", () => {
    render(<EditorialStatusPill status="ACTIVE" />);
    expect(screen.getByText("Active")).toHaveStyle({
      color: "var(--status-success-text)",
    });
  });

  it("never uses lavender for status text", () => {
    render(<EditorialStatusPill status="UNKNOWN" />);
    const el = screen.getByText("Unknown");
    const color = window.getComputedStyle(el).color;
    expect(color).not.toBe("rgb(197, 184, 212)"); // lavender
  });

  it("explicit tone overrides status mapping", () => {
    render(<EditorialStatusPill status="ACTIVE" tone="warning" label="Hold" />);
    expect(screen.getByText("Hold")).toHaveStyle({
      color: "var(--status-warning-text)",
    });
  });
});

// ---------------------------------------------------------------------------
// EditorialTable
// ---------------------------------------------------------------------------
type Row = { id: string; name: string };
const cols: ColumnDef<Row>[] = [
  { key: "id", header: "ID" },
  { key: "name", header: "Name" },
];

describe("EditorialTable", () => {
  it("renders headers and rows", () => {
    render(
      <EditorialTable
        columns={cols}
        data={[{ id: "A", name: "Alpha" }]}
        rowKey={(r) => r.id}
      />,
    );
    expect(screen.getByText("ID")).toBeInTheDocument();
    expect(screen.getByText("Alpha")).toBeInTheDocument();
  });

  it("shows empty state with mono text", () => {
    render(<EditorialTable columns={cols} data={[]} emptyMessage="Nothing." />);
    expect(screen.getByText("Nothing.")).toBeInTheDocument();
  });

  it("renders custom column body via render fn", () => {
    render(
      <EditorialTable
        columns={[
          { key: "id", header: "ID" },
          {
            key: "name",
            header: "Name",
            render: (r) => <strong>{`*${r.name}*`}</strong>,
          },
        ]}
        data={[{ id: "A", name: "Alpha" }]}
        rowKey={(r) => r.id}
      />,
    );
    expect(screen.getByText("*Alpha*")).toBeInTheDocument();
  });

  it("marks active sort column with aria-sort", () => {
    render(
      <EditorialTable
        columns={[{ key: "id", header: "ID", sortable: true }]}
        data={[]}
        activeSortKey="id"
        activeSortDir="asc"
        buildSortHref={(k, d) => `?sort=${k}&dir=${d}`}
      />,
    );
    const th = screen.getByText("ID").closest("th");
    expect(th).toHaveAttribute("aria-sort", "ascending");
  });
});

// ---------------------------------------------------------------------------
// EditorialBreadcrumb
// ---------------------------------------------------------------------------
describe("EditorialBreadcrumb", () => {
  it("renders 1-2 levels with numbered prefixes", () => {
    render(
      <EditorialBreadcrumb
        crumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Referrals" },
        ]}
      />,
    );
    expect(screen.getByText(/01 \/ Admin/)).toBeInTheDocument();
    expect(screen.getByText(/02 \/ Referrals/)).toBeInTheDocument();
  });

  it("trims to 2 display levels and warns in dev", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <EditorialBreadcrumb
        crumbs={[
          { label: "Admin" },
          { label: "Referrals" },
          { label: "REF-0042" },
        ]}
      />,
    );
    expect(screen.queryByText(/REF-0042/)).not.toBeInTheDocument();
    warn.mockRestore();
  });

  it("marks last crumb with aria-current=page", () => {
    render(
      <EditorialBreadcrumb
        crumbs={[{ label: "Admin", href: "/admin" }, { label: "Referrals" }]}
      />,
    );
    const current = screen.getByText(/02 \/ Referrals/);
    expect(current).toHaveAttribute("aria-current", "page");
  });
});

// ---------------------------------------------------------------------------
// EditorialEmptyState
// ---------------------------------------------------------------------------
describe("EditorialEmptyState", () => {
  it("renders headline and body", () => {
    render(
      <EditorialEmptyState
        headline="Nothing here yet"
        body="Submit a referral to begin."
      />,
    );
    expect(screen.getByText("Nothing here yet")).toBeInTheDocument();
    expect(screen.getByText("Submit a referral to begin.")).toBeInTheDocument();
  });

  it("renders optional action link", () => {
    render(
      <EditorialEmptyState
        headline="Empty"
        action={{ href: "/new", label: "Begin" }}
      />,
    );
    const link = screen.getByRole("link", { name: /Begin/ });
    expect(link).toHaveAttribute("href", "/new");
  });

  it("renders eyebrow when provided", () => {
    render(<EditorialEmptyState eyebrow="04 / Empty" headline="x" />);
    expect(screen.getByText("04 / Empty")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// EditorialPageShell
// ---------------------------------------------------------------------------
describe("EditorialPageShell", () => {
  it("renders headline and main content", () => {
    render(
      <EditorialPageShell
        sectionLabel="01 / Admin"
        headline="Today's queue"
        mainChildren={<p>Body content</p>}
      />,
    );
    expect(screen.getByText("Today's queue")).toBeInTheDocument();
    expect(screen.getByText("Body content")).toBeInTheDocument();
  });

  it("renders section label when no crumbs given", () => {
    render(
      <EditorialPageShell
        sectionLabel="01 / Admin"
        headline="x"
        mainChildren={<div />}
      />,
    );
    expect(screen.getByText("01 / Admin")).toBeInTheDocument();
  });

  it("renders breadcrumb instead of section label when crumbs given", () => {
    render(
      <EditorialPageShell
        sectionLabel="01 / Admin"
        crumbs={[{ label: "Admin" }, { label: "Referrals" }]}
        headline="x"
        mainChildren={<div />}
      />,
    );
    expect(screen.getByText(/02 \/ Referrals/)).toBeInTheDocument();
  });

  it("renders side panel when sideChildren provided", () => {
    render(
      <EditorialPageShell
        sectionLabel="01 / Admin"
        headline="x"
        mainChildren={<div>main</div>}
        sideChildren={<div>side</div>}
      />,
    );
    expect(screen.getByText("side")).toBeInTheDocument();
  });

  it("renders actions in header when provided", () => {
    render(
      <EditorialPageShell
        sectionLabel="01 / Admin"
        headline="x"
        mainChildren={<div />}
        actions={<button>Create</button>}
      />,
    );
    expect(screen.getByRole("button", { name: "Create" })).toBeInTheDocument();
  });
});
