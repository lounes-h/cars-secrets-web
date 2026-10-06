import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { Card, CardContent } from "@/components/ui/card";
import { countries, countryFromLanguages } from "@/lib/countries";
import { currentUser } from "@/lib/session";
import { metadataForRoute } from "@/lib/seo/metadata";

export const metadata = metadataForRoute("/register");

export default async function RegisterPage() {
  if (await currentUser()) redirect("/account");
  const defaultCountry = countryFromLanguages((await headers()).get("accept-language"));
  return (
    <main className="flex flex-1 justify-center px-4 py-8 sm:px-6 sm:py-16 lg:px-8">
      <div className="flex w-full max-w-md flex-col gap-6">
        <h1>Start your free trial</h1>
        <Card>
          <CardContent>
            <RegisterForm countries={countries()} defaultCountry={defaultCountry} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
