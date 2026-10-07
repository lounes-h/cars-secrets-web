"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import type { FormState } from "@/app/[lang]/(auth)/actions";
import { FormError } from "@/components/auth/FormError";
import { showServerErrors, useRememberedEmail } from "@/components/auth/form-helpers";
import { Turnstile } from "@/components/auth/Turnstile";
import { useI18n } from "@/components/I18nProvider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authSchemas, EMAIL_MAX, type EmailInput } from "@/lib/auth-schemas";
import { rich } from "@/lib/i18n";

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
  const { m } = useI18n();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);
  const form = useForm<EmailInput>({
    resolver: zodResolver(authSchemas(m.auth).emailSchema),
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
      <FieldGroup>
        <Alert role="status">
          <AlertDescription>{success?.(sentTo)}</AlertDescription>
        </Alert>
        <FieldDescription className="text-center">
          {rich(m.auth.emailRequest.wrongAddress, {
            link: (
              <Button type="button" variant="link" className="h-auto p-0 underline" onClick={() => setSentTo(null)}>
                {m.auth.emailRequest.tryAnother}
              </Button>
            ),
          })}
        </FieldDescription>
      </FieldGroup>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <FormError message={errors.root?.server?.message} />
        <Field data-invalid={errors.email ? true : undefined}>
          <FieldLabel htmlFor="email">{m.auth.email}</FieldLabel>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            maxLength={EMAIL_MAX}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? "email-error" : undefined}
            {...register("email")}
          />
          <FieldError id="email-error">{errors.email?.message}</FieldError>
        </Field>
        <Turnstile action={captchaAction} resetSignal={captchaReset} onToken={(token) => setValue("captcha_token", token ?? "")} />
        <Button type="submit" disabled={isSubmitting} size="lg" className="w-full">
          {isSubmitting ? pendingLabel : submitLabel}
        </Button>
      </FieldGroup>
    </form>
  );
}
