"use client";

import Link from "next/link";
import { useActionState, type ReactNode } from "react";
import { registerAction } from "@/app/(auth)/actions";
import { FieldError } from "@/components/auth/FieldError";
import { PasswordField } from "@/components/auth/PasswordField";
import { Turnstile } from "@/components/auth/Turnstile";

/** `phoneField` is rendered on the server (it lists every country) and passed in. */
export function RegisterForm({ phoneField }: { phoneField: ReactNode }) {
  const [state, action, pending] = useActionState(registerAction, undefined);
  const errors = state?.errors ?? {};

  if (state?.ok) {
    return (
      <p role="status" className="notice">
        Check your email: we sent a link to confirm your address. Once confirmed, you can{" "}
        <Link href="/login">sign in</Link>.
      </p>
    );
  }
  return (
    <form action={action} className="form-stack">
      {state?.message && <p role="alert">{state.message}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="first_name">First name</label>
          <input id="first_name" name="first_name" autoComplete="given-name" required maxLength={100} />
          <FieldError id="first_name-error" message={errors.first_name} />
        </div>
        <div>
          <label htmlFor="last_name">Last name</label>
          <input id="last_name" name="last_name" autoComplete="family-name" required maxLength={100} />
          <FieldError id="last_name-error" message={errors.last_name} />
        </div>
      </div>
      <div>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required />
        <FieldError id="email-error" message={errors.email} />
      </div>
      {phoneField}
      <FieldError id="phone-error" message={errors.phone} />
      <div>
        <PasswordField autoComplete="new-password" minLength={10} error={errors.password} />
        <p className="hint mt-1">At least 10 characters. Passwords found in known data breaches are refused.</p>
      </div>
      <div>
        <div className="flex items-start gap-2">
          <input id="accept_terms" name="accept_terms" type="checkbox" required className="mt-1" />
          <label htmlFor="accept_terms" className="font-normal">
            I accept the Terms of Use and Privacy Policy
          </label>
        </div>
        <FieldError id="accept_terms-error" message={errors.accept_terms} />
      </div>
      <Turnstile action="register" />
      <button type="submit" disabled={pending} className="btn btn-primary w-full">
        Create account
      </button>
      <p className="hint text-center">
        Already registered? <Link href="/login">Sign in</Link>
      </p>
    </form>
  );
}
