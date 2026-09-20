import { redirect } from "next/navigation";
import { logoutAction } from "@/app/(auth)/actions";
import { currentUser } from "@/lib/session";
import { metadataForRoute } from "@/lib/seo/metadata";

export const metadata = metadataForRoute("/account");

export default async function AccountPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  return (
    <main className="flex justify-center px-4 py-10 sm:px-6 sm:py-16 lg:px-10">
      <div className="auth-panel">
        <h1>Your account</h1>
        <p>
          You are signed in as {user.first_name} {user.last_name}.
        </p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 rounded-lg bg-sunken p-4">
          <dt className="font-semibold">Email</dt>
          <dd>{user.email}</dd>
          <dt className="font-semibold">Phone</dt>
          <dd>{user.phone ?? "Not provided"}</dd>
        </dl>
        <form action={logoutAction}>
          <button type="submit" className="btn btn-outline">
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}
