import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import FeedbackButton from "@/components/feedback/FeedbackButton";

const submissionId = "123e4567-e89b-42d3-a456-426614174000";

beforeAll(() => {
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: {
      configurable: true,
      value(this: HTMLDialogElement) {
        this.setAttribute("open", "");
      },
    },
    close: {
      configurable: true,
      value(this: HTMLDialogElement) {
        this.removeAttribute("open");
        this.dispatchEvent(new Event("close"));
      },
    },
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.history.replaceState({}, "", "/");
});

async function completeForm() {
  const user = userEvent.setup();
  await user.selectOptions(
    screen.getByLabelText("How much does this affect you?"),
    "p2_feature_degraded",
  );
  await user.type(screen.getByLabelText("Short title"), "Referral form does not submit");
  await user.type(
    screen.getByLabelText("What happened?"),
    "The form keeps my input but never advances.",
  );
  return user;
}

describe("global Vendor Portal feedback", () => {
  it("uses a fixed, keyboard-reachable button and native accessible dialog", async () => {
    const user = userEvent.setup();
    render(<FeedbackButton />);

    const trigger = screen.getByRole("button", { name: "Send feedback" });
    expect(trigger.tagName).toBe("BUTTON");
    expect(trigger).toHaveClass("fixed", "z-[100]", "min-h-11");
    expect(trigger).toHaveStyle({ backgroundColor: "var(--surface-root)" });
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await user.click(trigger);

    const dialog = screen.getByRole("dialog", { name: "Send feedback" });
    expect(dialog.tagName).toBe("DIALOG");
    expect(dialog).toHaveAttribute("open");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByLabelText("Short title")).toHaveFocus();

    await user.click(screen.getByRole("button", { name: "Close feedback" }));
    expect(dialog).not.toHaveAttribute("open");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("shows accessible inline validation before any network request", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<FeedbackButton />);

    await user.click(screen.getByRole("button", { name: "Send feedback" }));
    await user.click(screen.getByRole("button", { name: "Submit feedback" }));

    expect(screen.getByText("Choose how much this affects you.")).toBeVisible();
    expect(screen.getByText("Give your report a short title.")).toBeVisible();
    expect(screen.getByText("Describe what happened.")).toBeVisible();
    expect(screen.getByLabelText("How much does this affect you?")).toHaveFocus();
    expect(screen.getByLabelText("How much does this affect you?")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends only the allowlisted fields and strips query and fragment context", async () => {
    window.history.replaceState(
      {},
      "",
      "/partner/referrals/new?token=private#contact",
    );
    vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue(submissionId);
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json(
        { status: "ok", issue_key: "GEN-60", existing: false },
        { status: 201 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<FeedbackButton />);

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Send feedback" }));
    await user.selectOptions(screen.getByLabelText("Feedback type"), "bug");
    await user.selectOptions(
      screen.getByLabelText("How much does this affect you?"),
      "p2_feature_degraded",
    );
    await user.type(screen.getByLabelText("Short title"), "Referral form does not submit");
    await user.type(
      screen.getByLabelText("What happened?"),
      "The form keeps my input but never advances.",
    );
    await user.click(screen.getByRole("button", { name: "Submit feedback" }));

    await screen.findByText("Feedback sent as GEN-60.");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/feedback/submit");
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({ "Content-Type": "application/json" });
    const payload = JSON.parse(String(init.body));
    expect(Object.keys(payload).sort()).toEqual([
      "category",
      "description",
      "impact",
      "page_path",
      "submission_id",
      "title",
    ]);
    expect(payload).toEqual({
      submission_id: submissionId,
      category: "bug",
      impact: "p2_feature_degraded",
      title: "Referral form does not submit",
      description: "The form keeps my input but never advances.",
      page_path: "/partner/referrals/new",
    });
  });

  it("guards rapid submits and reuses the idempotency key on retry", async () => {
    vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue(submissionId);
    let resolveFirst!: (response: Response) => void;
    const firstResponse = new Promise<Response>((resolve) => {
      resolveFirst = resolve;
    });
    const fetchMock = vi
      .fn()
      .mockReturnValueOnce(firstResponse)
      .mockResolvedValueOnce(
        Response.json(
          { status: "ok", issue_key: "GEN-61", existing: true },
          { status: 200 },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);
    render(<FeedbackButton />);

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Send feedback" }));
    await completeForm();
    const submit = screen.getByRole("button", { name: "Submit feedback" });
    await user.click(submit);
    await user.click(submit);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(submit).toBeDisabled();
    resolveFirst(
      Response.json(
        { status: "error", error: "Feedback could not be submitted." },
        { status: 502 },
      ),
    );
    await screen.findByRole("alert");
    expect(screen.getByLabelText("Short title")).toHaveValue(
      "Referral form does not submit",
    );

    await user.click(screen.getByRole("button", { name: "Submit feedback" }));
    await screen.findByText("Feedback sent as GEN-61.");
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const firstPayload = JSON.parse(String(fetchMock.mock.calls[0][1].body));
    const retryPayload = JSON.parse(String(fetchMock.mock.calls[1][1].body));
    expect(firstPayload.submission_id).toBe(submissionId);
    expect(retryPayload.submission_id).toBe(submissionId);
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
  });
});
