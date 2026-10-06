import { redirect } from "next/navigation";
import { logoutAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { currentUser } from "@/lib/session";
import { metadataForRoute } from "@/lib/seo/metadata";

export const metadata = metadataForRoute("/account");

export default async function AccountPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  return (
    <main className="flex flex-1 justify-center px-4 py-10 sm:px-6 sm:py-16 lg:px-10">
      <div className="flex w-full max-w-md flex-col gap-5">
        <h1>Your account</h1>
        <Card>
          <CardContent>
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
              <dt className="font-medium">Email</dt>
              <dd>{user.email}</dd>
              <dt className="font-medium">Phone</dt>
              <dd>{user.phone ?? "Not provided"}</dd>
            </dl>
          </CardContent>
        </Card>
        <form action={logoutAction}>
          <Button type="submit" variant="outline">
            Sign out
          </Button>
        </form>
      </div>
    </main>
  );
}
