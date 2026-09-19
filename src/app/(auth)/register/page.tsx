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
    <main className="flex justify-center px-4 py-10 sm:px-6 sm:py-16 lg:px-10">
      <div className="auth-panel">
      <h1>Create your account</h1>
      <p>
        Register with Google, Apple or your email address. With an email address, we send you a link to confirm it
        before your first sign-in.
      </p>
      <div className="card form-stack">
        <SocialButtons intent="Register" />
        <p className="divider">or register with your email</p>
        <RegisterForm phoneField={<PhoneField />} />
      </div>
      </div>
    </main>
  );
}
