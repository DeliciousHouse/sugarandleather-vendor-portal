import React from "react";
import { act, render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ReferralForm from "@/components/referrals/ReferralForm";

describe("ReferralForm", () => {
  it("renders all required fields", () => {
    render(<ReferralForm onSubmit={vi.fn()} />);
    expect(screen.getByLabelText(/lead name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/lead email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^company$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/company domain/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /submit referral/i })).toBeInTheDocument();
  });

  it("shows validation error when submitted with empty leadName", async () => {
    render(<ReferralForm onSubmit={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /submit referral/i }));
    await waitFor(() =>
      expect(screen.getByText(/lead name is required/i)).toBeInTheDocument()
    );
  });

  it("shows validation error when both email and domain are empty", async () => {
    render(<ReferralForm onSubmit={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/lead name/i), {
      target: { value: "Alice Smith" },
    });
    fireEvent.click(screen.getByRole("button", { name: /submit referral/i }));
    await waitFor(() =>
      expect(
        screen.getByText(/email or company domain is required/i)
      ).toBeInTheDocument()
    );
  });

  it("calls onSubmit with correct data when form is valid", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<ReferralForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/lead name/i), {
      target: { value: "Alice Smith" },
    });
    fireEvent.change(screen.getByLabelText(/lead email/i), {
      target: { value: "alice@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^company$/i), {
      target: { value: "Example Co" },
    });

    fireEvent.click(screen.getByRole("button", { name: /submit referral/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledOnce();
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          leadName: "Alice Smith",
          leadEmail: "alice@example.com",
          leadCompany: "Example Co",
        })
      );
    });
  });

  it("does not include any edit controls — form is create-only", () => {
    render(<ReferralForm onSubmit={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /update/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /delete/i })).not.toBeInTheDocument();
  });

  it("shows a note explaining referrals only count after admin approval", () => {
    render(<ReferralForm onSubmit={vi.fn()} />);
    expect(
      screen.getByText(/admin approval/i)
    ).toBeInTheDocument();
  });

  it("disables the submit button while submission is in progress", async () => {
    let resolve: () => void;
    const onSubmit = vi.fn(
      () => new Promise<void>((res) => { resolve = res; })
    );

    render(<ReferralForm onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText(/lead name/i), {
      target: { value: "Bob" },
    });
    fireEvent.change(screen.getByLabelText(/lead email/i), {
      target: { value: "bob@test.com" },
    });

    fireEvent.click(screen.getByRole("button", { name: /submit referral/i }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /submitting/i })).toBeDisabled()
    );

    await act(async () => {
      resolve!();
    });
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /submit referral/i })).toBeEnabled()
    );
  });
});
