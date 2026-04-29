import React from "react";
import StatusPill from "@/components/ui/StatusPill";

export type NotificationItem = {
  id: string;
  userId: string | null;
  channel: string;
  status: string;
  title: string;
  body: string;
  entityType: string | null;
  entityId: string | null;
  readAt: Date | null;
  createdAt: Date;
};

interface NotificationListProps {
  notifications: NotificationItem[];
  emptyMessage?: string;
}

const CHANNEL_LABELS: Record<string, string> = {
  IN_APP: "In-app",
  EMAIL: "Email",
};

const STATUS_LABELS: Record<string, string> = {
  QUEUED: "Queued",
  SENT: "Sent",
  FAILED: "Failed",
  READ: "Read",
  DISMISSED: "Dismissed",
};

export default function NotificationList({
  notifications,
  emptyMessage = "No notifications.",
}: NotificationListProps) {
  if (notifications.length === 0) {
    return (
      <p
        style={{
          padding: "2rem 0",
          textAlign: "center",
          color: "var(--sl-mid-gray)",
          fontSize: "0.9375rem",
        }}
      >
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
      {notifications.map((n) => (
        <li
          key={n.id}
          style={{
            display: "flex",
            gap: "1rem",
            padding: "1rem 1.25rem",
            borderBottom: "1px solid var(--border-dark)",
            backgroundColor:
              n.status === "READ" || n.status === "DISMISSED"
                ? "transparent"
                : "var(--surface-panel)",
          }}
        >
          {/* Unread indicator */}
          <div
            style={{
              flexShrink: 0,
              width: "0.5rem",
              height: "0.5rem",
              borderRadius: "50%",
              marginTop: "0.4rem",
              backgroundColor:
                n.status === "READ" || n.status === "DISMISSED"
                  ? "transparent"
                  : "var(--sl-lavender)",
            }}
            aria-hidden="true"
          />

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "0.75rem",
                marginBottom: "0.25rem",
              }}
            >
              <span
                style={{
                  fontWeight: 600,
                  fontSize: "0.9375rem",
                  color: "var(--sl-cream)",
                  lineHeight: 1.4,
                }}
              >
                {n.title}
              </span>
              <StatusPill
                status={n.status}
                label={STATUS_LABELS[n.status] ?? n.status}
              />
            </div>

            <p
              style={{
                margin: "0 0 0.5rem",
                fontSize: "0.875rem",
                color: "var(--sl-silver)",
                lineHeight: 1.5,
              }}
            >
              {n.body}
            </p>

            <div
              style={{
                display: "flex",
                gap: "1rem",
                fontSize: "0.8125rem",
                color: "var(--sl-mid-gray)",
              }}
            >
              <span>{CHANNEL_LABELS[n.channel] ?? n.channel}</span>
              {n.entityType && (
                <span>
                  {n.entityType}
                  {n.entityId ? ` · ${n.entityId}` : ""}
                </span>
              )}
              <time dateTime={n.createdAt.toISOString()}>
                {new Date(n.createdAt).toLocaleString()}
              </time>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
