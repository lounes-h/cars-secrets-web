"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/(auth)/actions";
import { FieldError } from "@/components/auth/FieldError";
import { Turnstile } from "@/components/auth/Turnstile";

type Props = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  captchaAction: string;
  submitLabel: string;
  /** Shown whatever the address: the API never says whether an account exists. */
  successMessage: string;
};

/** One email field + captcha: used by "forgot password" and "resend confirmation". */
export function EmailRequestForm({ action: serverAction, captchaAction, submitLabel, successMessage }: Props) {
  const [state, action, pending] = useActionState(serverAction, undefined);
  if (state?.ok) return <p role="status">{successMessage}</p>;
  return (
    <form action={action}>
      {state?.message && <p role="alert">{state.message}</p>}
      <div>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required />
        <FieldError id="email-error" message={state?.errors?.email} />
      </div>
      <Turnstile action={captchaAction} />
      <button type="submit" disabled={pending}>
        {submitLabel}
      </button>
    </form>
  );
}
