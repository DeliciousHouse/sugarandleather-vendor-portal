import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import StatusPill from "@/components/ui/StatusPill";
import DataTable, { ColumnDef } from "@/components/ui/DataTable";
import Logo from "@/components/brand/Logo";

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------
describe("Button", () => {
  it("renders with the provided text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
  });

  it.each(["primary", "secondary", "ghost", "danger"] as const)(
    "renders %s variant without error",
    (variant) => {
      render(<Button variant={variant}>{variant}</Button>);
      expect(screen.getByRole("button", { name: variant })).toBeInTheDocument();
    }
  );

  it("renders all size variants without error", () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    expect(screen.getByRole("button")).toBeInTheDocument();
    rerender(<Button size="md">Medium</Button>);
    expect(screen.getByRole("button")).toBeInTheDocument();
    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("is disabled when the disabled prop is set", () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole("button", { name: "Disabled" })).toBeDisabled();
  });

  it("forwards extra HTML button attributes", () => {
    render(<Button type="submit" data-testid="submit-btn">Submit</Button>);
    const btn = screen.getByTestId("submit-btn");
    expect(btn).toHaveAttribute("type", "submit");
  });
});

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------
describe("Card", () => {
  it("renders its children", () => {
    render(
      <Card>
        <p>Card content</p>
      </Card>
    );
    expect(screen.getByText("Card content")).toBeInTheDocument();
  });

  it("accepts an additional className", () => {
    render(<Card className="extra-class">Content</Card>);
    const card = screen.getByText("Content").closest("div");
    expect(card?.className).toContain("extra-class");
  });
});

// ---------------------------------------------------------------------------
// Badge
// ---------------------------------------------------------------------------
describe("Badge", () => {
  it.each(["default", "success", "warning", "danger", "neutral"] as const)(
    "renders %s variant without error",
    (variant) => {
      render(<Badge variant={variant}>{variant} label</Badge>);
      expect(screen.getByText(`${variant} label`)).toBeInTheDocument();
    }
  );

  it("renders with default variant when no variant prop is given", () => {
    render(<Badge>No variant</Badge>);
    expect(screen.getByText("No variant")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// StatusPill
// ---------------------------------------------------------------------------
describe("StatusPill", () => {
  it("maps ACTIVE to a success badge", () => {
    render(<StatusPill status="ACTIVE" />);
    const el = screen.getByText("ACTIVE");
    // success badge has green text colour set via inline style
    expect(el).toBeInTheDocument();
    expect(el).toHaveStyle({ color: "var(--status-success-text)" });
  });

  it("maps REJECTED to a danger badge", () => {
    render(<StatusPill status="REJECTED" />);
    const el = screen.getByText("REJECTED");
    expect(el).toHaveStyle({ color: "var(--status-danger-text)" });
  });

  it("maps PENDING_REVIEW to a neutral badge", () => {
    render(<StatusPill status="PENDING_REVIEW" />);
    const el = screen.getByText("PENDING_REVIEW");
    expect(el).toHaveStyle({ color: "var(--sl-silver)" });
  });

  it("maps an unknown status to the default (lavender) badge", () => {
    render(<StatusPill status="SOME_UNKNOWN_STATUS" />);
    const el = screen.getByText("SOME_UNKNOWN_STATUS");
    expect(el).toHaveStyle({ color: "var(--sl-lavender)" });
  });

  it("displays a custom label when provided", () => {
    render(<StatusPill status="ACTIVE" label="Live" />);
    expect(screen.getByText("Live")).toBeInTheDocument();
    expect(screen.queryByText("ACTIVE")).not.toBeInTheDocument();
  });

  it("displays the status value when no label is given", () => {
    render(<StatusPill status="DRAFT" />);
    expect(screen.getByText("DRAFT")).toBeInTheDocument();
  });

  it("maps INVITED to a warning badge", () => {
    render(<StatusPill status="INVITED" />);
    const el = screen.getByText("INVITED");
    expect(el).toHaveStyle({ color: "var(--status-warning-text)" });
  });
});

// ---------------------------------------------------------------------------
// DataTable
// ---------------------------------------------------------------------------
type SampleRow = { id: unknown; name: unknown; role: unknown };

const sampleColumns: ColumnDef<SampleRow>[] = [
  { key: "id", header: "ID" },
  { key: "name", header: "Name" },
  { key: "role", header: "Role" },
];

const sampleData: SampleRow[] = [
  { id: 1, name: "Alice", role: "Admin" },
  { id: 2, name: "Bob", role: "Vendor" },
];

describe("DataTable", () => {
  it("renders column headers", () => {
    render(<DataTable columns={sampleColumns} data={sampleData} />);
    expect(screen.getByText("ID")).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Role")).toBeInTheDocument();
  });

  it("renders data rows", () => {
    render(<DataTable columns={sampleColumns} data={sampleData} />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByText("Vendor")).toBeInTheDocument();
  });

  it("shows default empty message when data is empty", () => {
    render(<DataTable columns={sampleColumns} data={[]} />);
    expect(screen.getByText("No data")).toBeInTheDocument();
  });

  it("shows a custom emptyMessage when data is empty", () => {
    render(
      <DataTable columns={sampleColumns} data={[]} emptyMessage="Nothing here" />
    );
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
  });

  it("uses a custom render function for a column", () => {
    const columns: ColumnDef<SampleRow>[] = [
      ...sampleColumns.slice(0, 2),
      {
        key: "role",
        header: "Role",
        render: (value) => <strong>{String(value)}-custom</strong>,
      },
    ];
    render(<DataTable columns={columns} data={sampleData} />);
    expect(screen.getByText("Admin-custom")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Logo
// ---------------------------------------------------------------------------
describe("Logo", () => {
  it("renders Sugar & Leather text", () => {
    render(<Logo />);
    expect(screen.getByText("Sugar & Leather")).toBeInTheDocument();
  });

  it("renders light variant by default", () => {
    render(<Logo />);
    const el = screen.getByText("Sugar & Leather");
    expect(el).toHaveStyle({ color: "var(--sl-cream)" });
  });

  it("renders dark variant", () => {
    render(<Logo variant="dark" />);
    const el = screen.getByText("Sugar & Leather");
    expect(el).toHaveStyle({ color: "var(--sl-obsidian)" });
  });

  it.each(["sm", "md", "lg"] as const)("renders size %s without error", (size) => {
    render(<Logo size={size} />);
    expect(screen.getByText("Sugar & Leather")).toBeInTheDocument();
  });
});
