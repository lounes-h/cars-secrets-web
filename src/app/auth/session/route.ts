/**
 * Who is signed in, and how many of their alerts are unread, for the top banner. The banner asks
 * from the browser so that pages stay statically rendered; only the names, the email and the count
 * leave this route, never the token.
 */

import { unreadAlerts } from "@/lib/alerts";
import { currentUser, sessionToken } from "@/lib/session";

export type SessionSummary = { user: { first_name: string; last_name: string; email: string } | null; unread: number };

export async function GET(): Promise<Response> {
  let summary: SessionSummary = { user: null, unread: 0 };
  try {
    const token = await sessionToken();
    // Asked together, so the banner waits for one round trip to the API rather than two.
    const [user, unread] = await Promise.all([currentUser(), token ? unreadAlerts(token) : 0]);
    if (user) summary = { user: { first_name: user.first_name, last_name: user.last_name, email: user.email }, unread };
  } catch {
    // API unreachable: show the signed-out banner rather than an error.
  }
  return Response.json(summary, { headers: { "Cache-Control": "private, no-store" } });
}
