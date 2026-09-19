import { redirect } from "next/navigation";
import { logoutAction } from "@/app/(auth)/actions";
import { currentUser } from "@/lib/session";
import { metadataForRoute } from "@/lib/seo/metadata";

export const metadata = metadataForRoute("/account");

export default async function AccountPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  return (
    <main className="px-4 py-8 sm:px-6 lg:px-10">
      <h1>Your account</h1>
      <p className="max-w-[65ch]">
        You are signed in as {user.first_name} {user.last_name}.
      </p>
      <dl>
        <dt>Email</dt>
        <dd>{user.email}</dd>
        <dt>Phone</dt>
        <dd>{user.phone ?? "Not provided"}</dd>
      </dl>
      <form action={logoutAction}>
        <button type="submit">Sign out</button>
      </form>
    </main>
  );
}
