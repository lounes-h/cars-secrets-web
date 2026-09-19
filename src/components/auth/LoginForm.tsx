"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction } from "@/app/(auth)/actions";
import { PasswordField } from "@/components/auth/PasswordField";
import { Turnstile } from "@/components/auth/Turnstile";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, undefined);
  return (
    <form action={action}>
      {state?.message && (
        <p role="alert">
          {state.message}
          {state.code === "email_unverified" && (
            <>
              {" "}
              <Link href="/verify-email">Resend the confirmation email</Link>
            </>
          )}
        </p>
      )}
      <div>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <PasswordField autoComplete="current-password" />
      <div>
        <input id="remember" name="remember" type="checkbox" />
        <label htmlFor="remember">Remember me</label>
      </div>
      {state?.captchaRequired && <Turnstile action="login" />}
      <button type="submit" disabled={pending}>
        Sign in
      </button>
      <p>
        <Link href="/forgot-password">Forgot your password?</Link>
      </p>
      <p>
        New here? <Link href="/register">Create an account</Link>
      </p>
    </form>
  );
}
