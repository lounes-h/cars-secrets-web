"use server";

import { refresh } from "next/cache";
import { markAlertsRead } from "@/lib/alerts";
import { sessionToken, visitorIp } from "@/lib/session";

/** Marks an alert read as the dealer follows one of its links. Best effort: it stays unread otherwise. */
export async function markAlertReadAction(id: number): Promise<void> {
  const token = await sessionToken();
  if (!token || !Number.isSafeInteger(id) || id < 1) return;
  try {
    await markAlertsRead([id], token, await visitorIp());
  } catch {
    // Still unread; nothing else depends on it.
  }
}

/** Marks every alert read, then shows the page again. */
export async function markAllAlertsReadAction(): Promise<void> {
  const token = await sessionToken();
  if (!token) return;
  try {
    await markAlertsRead(null, token, await visitorIp());
  } catch {
    // The page shows them as they are.
  }
  refresh();
}
