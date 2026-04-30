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
    },
  );

  it("primary variant uses cream background, never lavender", () => {
    render(<Button variant="primary">Go</Button>);
    const btn = screen.getByRole("button", { name: "Go" });
    expect(btn).toHaveStyle({ backgroundColor: "var(--sl-cream)" });
  });

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
      </Card>,
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
    },
  );

  it("renders with default variant when no variant prop is given", () => {
    render(<Badge>No variant</Badge>);
    expect(screen.getByText("No variant")).toBeInTheDocument();
  });

  it("default variant uses silver text, not lavender", () => {
    render(<Badge>plain</Badge>);
    expect(screen.getByText("plain")).toHaveStyle({
      color: "var(--sl-silver)",
    });
  });
});

// ---------------------------------------------------------------------------
// StatusPill
// ---------------------------------------------------------------------------
describe("StatusPill", () => {
  it("maps ACTIVE to a success tone", () => {
    render(<StatusPill status="ACTIVE" />);
    const el = screen.getByText("Active");
    expect(el).toHaveStyle({ color: "var(--status-success-text)" });
  });

  it("maps REJECTED to a danger tone", () => {
    render(<StatusPill status="REJECTED" />);
    const el = screen.getByText("Rejected");
    expect(el).toHaveStyle({ color: "var(--status-danger-text)" });
  });

  it("maps PENDING_REVIEW to neutral", () => {
    render(<StatusPill status="PENDING_REVIEW" />);
    const el = screen.getByText("Pending Review");
    expect(el).toHaveStyle({ color: "var(--sl-silver)" });
  });

  it("maps INVITED to warning", () => {
    render(<StatusPill status="INVITED" />);
    const el = screen.getByText("Invited");
    expect(el).toHaveStyle({ color: "var(--status-warning-text)" });
  });

  it("falls back to silver (info) on unknown status — never lavender", () => {
    render(<StatusPill status="SOME_UNKNOWN_STATUS" />);
    const el = screen.getByText("Some Unknown Status");
    expect(el).toHaveStyle({ color: "var(--sl-silver)" });
  });

  it("displays a custom label when provided", () => {
    render(<StatusPill status="ACTIVE" label="Live" />);
    expect(screen.getByText("Live")).toBeInTheDocument();
    expect(screen.queryByText("Active")).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// DataTable (legacy — kept for callers not yet ported to EditorialTable)
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

describe("DataTable (legacy)", () => {
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
  });

  it("shows default empty message when data is empty", () => {
    render(<DataTable columns={sampleColumns} data={[]} />);
    expect(screen.getByText("No data")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Logo (with eye/heart mark, post-Phase-A)
// ---------------------------------------------------------------------------
describe("Logo", () => {
  it("renders the brand mark image with alt text", () => {
    render(<Logo />);
    const img = screen.getByAltText("Sugar & Leather");
    expect(img).toBeInTheDocument();
  });

  it("uses cream variant by default (logo-cream.png)", () => {
    render(<Logo />);
    const img = screen.getByAltText("Sugar & Leather") as HTMLImageElement;
    expect(img.src).toContain("logo-cream");
  });

  it("uses obsidian variant when requested", () => {
    render(<Logo variant="obsidian" />);
    const img = screen.getByAltText("Sugar & Leather") as HTMLImageElement;
    expect(img.src).toContain("logo-obsidian");
  });

  it("renders wordmark when withWordmark is true", () => {
    render(<Logo withWordmark />);
    expect(screen.getByText("Sugar & Leather AI")).toBeInTheDocument();
  });

  it("does not render wordmark by default", () => {
    render(<Logo />);
    expect(screen.queryByText("Sugar & Leather AI")).not.toBeInTheDocument();
  });

  it.each(["sm", "md", "lg"] as const)(
    "renders size %s without error",
    (size) => {
      render(<Logo size={size} />);
      expect(screen.getByAltText("Sugar & Leather")).toBeInTheDocument();
    },
  );
});
