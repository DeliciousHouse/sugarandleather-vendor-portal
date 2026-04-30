import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getRequiredAdmin } from "@/lib/auth";
import {
  getApplicationMetadataTitle,
  getApplicationReviewDetail,
} from "@/domain/applications/queries";
import EditorialPageShell from "@/components/brand/EditorialPageShell";
import ApplicationReviewPanel from "@/components/applications/ApplicationReviewPanel";
import ReviewActions from "./ReviewActions";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const name = await getApplicationMetadataTitle(
    prisma as unknown as Parameters<typeof getApplicationMetadataTitle>[0],
    id,
  );
  return {
    title: name
      ? `${name} · Applications · Admin`
      : "Application · Admin",
  };
}

export default async function AdminApplicationDetailPage({
  params,
}: PageProps) {
  await getRequiredAdmin();
  const { id } = await params;

  const app = await getApplicationReviewDetail(
    prisma as unknown as Parameters<typeof getApplicationReviewDetail>[0],
    id,
  );

  if (!app) notFound();

  return (
    <EditorialPageShell
      sectionLabel="03 / Application"
      crumbs={[
        { label: "Applications", href: "/admin/applications" },
        { label: app.fullName },
      ]}
      eyebrow="Review"
      headline={app.fullName}
      subheadline={`${app.email} · ${app.country}`}
      mainChildren={
        <ApplicationReviewPanel app={app} actions={<ReviewActions app={app} />} />
      }
    />
  );
}
