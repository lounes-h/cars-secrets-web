import { redirect } from "next/navigation";
import { PhoneField } from "@/components/auth/PhoneField";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { SocialButtons } from "@/components/auth/SocialButtons";
import { currentUser } from "@/lib/session";
import { metadataForRoute } from "@/lib/seo/metadata";

export const metadata = metadataForRoute("/register");

export default async function RegisterPage() {
  if (await currentUser()) redirect("/account");
  return (
    <main className="px-4 py-8 sm:px-6 lg:px-10">
      <h1>Create your account</h1>
      <p className="max-w-[65ch]">
        Register with Google, Apple or your email address. With an email address, we send you a link to confirm it
        before your first sign-in.
      </p>
      <SocialButtons intent="Register" />
      <p>or register with your email</p>
      <RegisterForm phoneField={<PhoneField />} />
    </main>
  );
}
