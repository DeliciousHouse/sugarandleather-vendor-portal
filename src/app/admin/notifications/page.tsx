import React from "react";
import { redirect } from "next/navigation";
import { getRequiredAdmin } from "@/lib/auth";
import { getAdminNotificationsForPage } from "@/domain/notifications/service";
import NotificationList from "@/components/notifications/NotificationList";

export const dynamic = "force-dynamic";

export default async function AdminNotificationsPage() {
  try {
    await getRequiredAdmin();
  } catch {
    redirect("/login");
  }

  const notifications = await getAdminNotificationsForPage();

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--surface-root)",
        padding: "2rem",
      }}
    >
      <div style={{ maxWidth: "56rem", margin: "0 auto" }}>
        <div style={{ marginBottom: "2rem" }}>
          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "2rem",
              fontWeight: 700,
              color: "var(--sl-cream)",
              marginBottom: "0.25rem",
            }}
          >
            Notifications
          </h1>
          <p style={{ fontSize: "0.9375rem", color: "var(--sl-silver)" }}>
            System and partner notifications across all workflow events.
          </p>
        </div>

        <div
          style={{
            borderRadius: "0.75rem",
            border: "1px solid var(--border-dark)",
            overflow: "hidden",
          }}
        >
          <NotificationList
            notifications={notifications}
            emptyMessage="No notifications yet."
          />
        </div>
      </div>
    </div>
  );
}

