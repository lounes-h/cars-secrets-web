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
    <main className="px-4 py-8 sm:px-6 lg:px-10">
      <h1>Sign in</h1>
      <p className="max-w-[65ch]">Sign in with Google, Apple, or the email address and password of your account.</p>
      {error && <p role="alert">{messageFor(error)}</p>}
      <SocialButtons intent="Sign in" />
      <p>or sign in with your email</p>
      <LoginForm />
    </main>
  );
}
