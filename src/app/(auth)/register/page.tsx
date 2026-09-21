import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { countries, countryFromLanguages } from "@/lib/countries";
import { currentUser } from "@/lib/session";
import { metadataForRoute } from "@/lib/seo/metadata";

export const metadata = metadataForRoute("/register");

export default async function RegisterPage() {
  if (await currentUser()) redirect("/account");
  const defaultCountry = countryFromLanguages((await headers()).get("accept-language"));
  return (
    <main className="auth-main flex justify-center px-4 py-10 sm:px-6 sm:py-16 lg:px-10">
      <div className="auth-panel">
      <h1>Start your free trial</h1>
      <div className="card form-stack">
        <RegisterForm countries={countries()} defaultCountry={defaultCountry} />
      </div>
      </div>
    </main>
  );
}
