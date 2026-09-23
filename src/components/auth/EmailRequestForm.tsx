"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import type { FormState } from "@/app/(auth)/actions";
import { FieldError, FormError } from "@/components/auth/FieldError";
import { showServerErrors, useRememberedEmail } from "@/components/auth/form-helpers";
import { Turnstile } from "@/components/auth/Turnstile";
import { EMAIL_MAX, emailSchema, type EmailInput } from "@/lib/auth-schemas";

type Props = {
  action: (input: EmailInput) => Promise<FormState>;
  captchaAction: string;
  submitLabel: string;
  pendingLabel: string;
  /** Shown whatever the address: the API never says whether an account exists. */
  success?: (email: string) => ReactNode;
  /** Replaces the whole sent state instead; `retry` goes back to the email field. */
  next?: (email: string, retry: () => void) => ReactNode;
};

/** One email field + captcha: used by "forgot password" and "confirm your email". */
export function EmailRequestForm({ action, captchaAction, submitLabel, pendingLabel, success, next }: Props) {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);
  const form = useForm<EmailInput>({
    resolver: zodResolver(emailSchema),
    // A field is checked once it has been visited, then on every submit.
    mode: "onTouched",
    defaultValues: { email: "", captcha_token: "" },
  });
  const { register, handleSubmit, setValue, formState } = form;
  const { errors, isSubmitting } = formState;
  useRememberedEmail(form);

  const onSubmit = handleSubmit(async (values) => {
    const state = await action(values);
    if (state?.ok) {
      setSentTo(values.email);
      return;
    }
    showServerErrors(form, state);
    setCaptchaReset((n) => n + 1);
  });

  if (sentTo && next) return next(sentTo, () => setSentTo(null));
  if (sentTo) {
    return (
      <div role="status" className="form-stack">
        <p className="notice">{success?.(sentTo)}</p>
        <p className="hint text-center">
          Wrong address?{" "}
          <button type="button" className="btn btn-link inline p-0 underline" onClick={() => setSentTo(null)}>
            Try another one
          </button>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="form-stack">
      <FormError message={errors.root?.server?.message} />
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          maxLength={EMAIL_MAX}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...register("email")}
        />
        <FieldError id="email-error" message={errors.email?.message} />
      </div>
      <Turnstile action={captchaAction} resetSignal={captchaReset} onToken={(token) => setValue("captcha_token", token ?? "")} />
      <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full">
        {isSubmitting ? pendingLabel : submitLabel}
      </button>
    </form>
  );
}
