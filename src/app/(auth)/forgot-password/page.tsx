import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { metadataForRoute } from "@/lib/seo/metadata";

export const metadata = metadataForRoute("/forgot-password");

export default function ForgotPasswordPage() {
  return (
    <main className="px-4 py-8 sm:px-6 lg:px-10">
      <h1>Forgot your password</h1>
      <p className="max-w-[65ch]">
        Enter the email address of your account and we will send you a link to choose a new password.
      </p>
      <ForgotPasswordForm />
      <p>
        <Link href="/login">Back to sign in</Link>
      </p>
    </main>
  );
}
