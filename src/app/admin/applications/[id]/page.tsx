import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getRequiredAdmin } from "@/lib/auth";
import {
  getApplicationMetadataTitle,
  getApplicationReviewDetail,
} from "@/domain/applications/queries";
import ApplicationReviewPanel from "@/components/applications/ApplicationReviewPanel";
import ReviewActions from "./ReviewActions";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const name = await getApplicationMetadataTitle(
    prisma as unknown as Parameters<typeof getApplicationMetadataTitle>[0],
    id
  );
  return {
    title: name
      ? `${name} — Applications — Admin`
      : "Application — Admin",
  };
}

export default async function AdminApplicationDetailPage({ params }: PageProps) {
  await getRequiredAdmin();
  const { id } = await params;

  const app = await getApplicationReviewDetail(
    prisma as unknown as Parameters<typeof getApplicationReviewDetail>[0],
    id
  );

  if (!app) notFound();

  const detail = app;

  return (
    <main
      className="min-h-screen py-10 px-6"
      style={{ backgroundColor: "var(--surface-root)" }}
    >
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link
            href="/admin/applications"
            className="text-sm hover:underline"
            style={{ color: "var(--sl-lavender)" }}
          >
            ← Back to applications
          </Link>
        </div>
        <ApplicationReviewPanel
          app={detail}
          actions={<ReviewActions app={detail} />}
        />
      </div>
    </main>
  );
}
