import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Cormorant_Garamond: () => ({ variable: "heading" }),
  Inter: () => ({ variable: "body" }),
  Courier_Prime: () => ({ variable: "mono" }),
}));

import RootLayout from "@/app/layout";
import FeedbackButton from "@/components/feedback/FeedbackButton";

describe("root feedback mount", () => {
  it("mounts exactly one global feedback control after page content", () => {
    const page = <main>Route content</main>;
    const root = RootLayout({ children: page }) as ReactElement<{
      children: ReactElement<{ children: ReactNode }>;
    }>;
    const bodyChildren = Children.toArray(root.props.children.props.children);
    const feedbackMounts = bodyChildren.filter(
      (child) => isValidElement(child) && child.type === FeedbackButton,
    );

    expect(feedbackMounts).toHaveLength(1);
    expect(bodyChildren.indexOf(page)).toBeLessThan(
      bodyChildren.indexOf(feedbackMounts[0]),
    );
  });
});
