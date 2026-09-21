import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { messageFor } from "@/components/auth/messages";
import { SocialButtons } from "@/components/auth/SocialButtons";
import { currentUser } from "@/lib/session";
import { metadataForRoute } from "@/lib/seo/metadata";

export const metadata = metadataForRoute("/login");

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await currentUser()) redirect("/account");
  const { error } = await searchParams;
  return (
    <main className="auth-main flex justify-center px-4 py-10 sm:px-6 sm:py-16 lg:px-10">
      <div className="auth-panel">
      <h1>Sign in</h1>
      <p>Sign in with Google, Apple, or the email address and password of your account.</p>
      {error && (
        <p role="alert" className="notice">
          {messageFor(error)}
        </p>
      )}
      <div className="card form-stack">
        <SocialButtons intent="Sign in" />
        <p className="divider">or sign in with your email</p>
        <LoginForm />
      </div>
      </div>
    </main>
  );
}
