import React from "react";
import EditorialStatusPill from "@/components/brand/EditorialStatusPill";

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
      <p className="border-t border-[var(--border-dark)] py-12 text-center font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--sl-silver)]">
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul className="flex flex-col">
      {notifications.map((n) => {
        const unread = n.status !== "READ" && n.status !== "DISMISSED";
        return (
          <li
            key={n.id}
            className="flex gap-6 border-b border-[var(--border-dark)] py-6 last:border-b-0"
          >
            <div
              aria-hidden
              className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${
                unread ? "bg-[var(--sl-lavender)]" : "bg-transparent"
              }`}
            />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <span className="font-heading text-lg leading-tight text-[var(--sl-cream)]">
                  {n.title}
                </span>
                <EditorialStatusPill
                  status={n.status}
                  label={STATUS_LABELS[n.status] ?? n.status}
                />
              </div>
              <p className="mt-2 font-body text-sm leading-relaxed text-[var(--sl-silver)]">
                {n.body}
              </p>
              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--sl-silver)]">
                <span>{CHANNEL_LABELS[n.channel] ?? n.channel}</span>
                {n.entityType ? (
                  <span>
                    {n.entityType}
                    {n.entityId ? ` · ${n.entityId}` : ""}
                  </span>
                ) : null}
                <time dateTime={n.createdAt.toISOString()}>
                  {new Date(n.createdAt).toLocaleString()}
                </time>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
