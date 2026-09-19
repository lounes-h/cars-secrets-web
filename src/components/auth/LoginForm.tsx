"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction } from "@/app/(auth)/actions";
import { PasswordField } from "@/components/auth/PasswordField";
import { Turnstile } from "@/components/auth/Turnstile";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, undefined);
  return (
    <form action={action} className="form-stack">
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
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <input id="remember" name="remember" type="checkbox" />
          <label htmlFor="remember" className="mb-0 font-normal">
            Remember me
          </label>
        </div>
        <Link href="/forgot-password" className="text-sm">
          Forgot your password?
        </Link>
      </div>
      {state?.captchaRequired && <Turnstile action="login" />}
      <button type="submit" disabled={pending} className="btn btn-primary w-full">
        Sign in
      </button>
      <p className="hint text-center">
        New here? <Link href="/register">Create an account</Link>
      </p>
    </form>
  );
}
