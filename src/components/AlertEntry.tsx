"use client";

import { type ReactNode, useState } from "react";
import { markAlertReadAction } from "@/app/[lang]/alerts/actions";
import { useI18n } from "@/components/I18nProvider";

/**
 * One alert in the inbox. While unread it carries a dot and its heading is bold (`data-unread`);
 * following any of its links marks it read. Nothing else changes with it: saved lots, searches
 * and settings stay as they are.
 */
export function AlertEntry({ id, read, children }: { id: number; read: boolean; children: ReactNode }) {
  const { m } = useI18n();
  // The page's word wins once it is shown again (Mark all as read); until then, a followed link.
  const [followed, setFollowed] = useState(false);
  const unread = !read && !followed;
  return (
    <article
      data-unread={unread ? "" : undefined}
      className="group relative rounded-xl border p-4 sm:p-6"
      onClickCapture={(event) => {
        if (!unread || !(event.target as Element).closest("a")) return;
        setFollowed(true);
        void markAlertReadAction(id);
      }}
    >
      {unread && (
        <span className="absolute top-6 left-1.5 size-2 rounded-full bg-foreground sm:top-8 sm:left-2.5">
          <span className="sr-only">{m.alerts.unread}</span>
        </span>
      )}
      {children}
    </article>
  );
}
