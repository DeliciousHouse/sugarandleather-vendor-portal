import React from "react";
import { redirect } from "next/navigation";
import { getRequiredAdmin } from "@/lib/auth";
import { getAdminNotificationsForPage } from "@/domain/notifications/service";
import EditorialPageShell from "@/components/brand/EditorialPageShell";
import NotificationList from "@/components/notifications/NotificationList";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Notifications · Admin · Sugar & Leather",
};

export default async function AdminNotificationsPage() {
  try {
    await getRequiredAdmin();
  } catch {
    redirect("/login");
  }

  const notifications = await getAdminNotificationsForPage();

  return (
    <EditorialPageShell
      sectionLabel="02 / Notifications"
      crumbs={[
        { label: "Admin", href: "/admin" },
        { label: "Notifications" },
      ]}
      eyebrow="System messages"
      headline={
        notifications.length === 0
          ? "Nothing new"
          : `${notifications.length} ${notifications.length === 1 ? "notification" : "notifications"}`
      }
      subheadline="Across all workflow events"
      mainChildren={
        <NotificationList
          notifications={notifications}
          emptyMessage="No notifications yet."
        />
      }
    />
  );
}
