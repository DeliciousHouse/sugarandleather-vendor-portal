import ApplicationForm from "@/components/applications/ApplicationForm";
import { submitApplicationAction } from "./actions";

export const metadata = {
  title: "Apply to Partner — Sugar & Leather AI",
  description:
    "Apply to the Sugar & Leather affiliate and vendor partner program.",
};

export default function ApplyPage() {
  return (
    <main
      className="min-h-screen py-16 px-4"
      style={{ backgroundColor: "var(--surface-root)" }}
    >
      <div className="max-w-2xl mx-auto">
        <header className="mb-10">
          <h1
            className="text-4xl font-bold mb-3"
            style={{
              fontFamily: "var(--font-heading)",
              color: "var(--sl-cream)",
            }}
          >
            Partner with Sugar &amp; Leather AI
          </h1>
          <p style={{ color: "var(--sl-silver)" }}>
            We partner with consultants, educators, content creators, and
            advisors who share our belief that AI should feel human. If that
            sounds like you, apply below.
          </p>
          <p className="text-sm mt-3" style={{ color: "var(--sl-mid-gray)" }}>
            All applications are reviewed manually. We will reach out if your
            application is a fit.
          </p>
        </header>

        <ApplicationForm action={submitApplicationAction} />
      </div>
    </main>
  );
}
