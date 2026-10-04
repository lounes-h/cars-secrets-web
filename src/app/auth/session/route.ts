/**
 * Who is signed in, for the top banner. The banner asks from the browser so that pages stay
 * statically rendered; only the names and the email leave this route, never the token.
 */

import { currentUser } from "@/lib/session";

export type SessionSummary = { user: { first_name: string; last_name: string; email: string } | null };

export async function GET(): Promise<Response> {
  let summary: SessionSummary = { user: null };
  try {
    const user = await currentUser();
    if (user) summary = { user: { first_name: user.first_name, last_name: user.last_name, email: user.email } };
  } catch {
    // API unreachable: show the signed-out banner rather than an error.
  }
  return Response.json(summary, { headers: { "Cache-Control": "private, no-store" } });
}
