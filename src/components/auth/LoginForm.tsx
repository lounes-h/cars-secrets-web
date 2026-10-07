"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { loginAction } from "@/app/[lang]/(auth)/actions";
import { FormError } from "@/components/auth/FormError";
import { showServerErrors, useRememberedEmail } from "@/components/auth/form-helpers";
import { PasswordField } from "@/components/auth/PasswordField";
import { Turnstile } from "@/components/auth/Turnstile";
import { VerifyEmailForm } from "@/components/auth/VerifyEmailForm";
import { useI18n } from "@/components/I18nProvider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authSchemas, EMAIL_MAX, type LoginInput } from "@/lib/auth-schemas";
import { localePath, rich } from "@/lib/i18n";

/** `remember` ticks the box when the last sign-in in this browser had it ticked. */
export function LoginForm({ remember = false }: { remember?: boolean }) {
  const { locale, m } = useI18n();
  const [unconfirmed, setUnconfirmed] = useState<{ email: string; remember: boolean } | null>(null);
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [captchaReset, setCaptchaReset] = useState(0);
  const form = useForm<LoginInput>({
    resolver: zodResolver(authSchemas(m.auth).loginSchema),
    // A field is checked once it has been visited, then on every submit.
    mode: "onTouched",
    defaultValues: { email: "", password: "", remember, captcha_token: "" },
  });
  const { register, handleSubmit, setValue, control, formState } = form;
  const { errors, isSubmitting } = formState;
  useRememberedEmail(form, "email", "password");

  const onSubmit = handleSubmit(async (values) => {
    // On success the action redirects to /active-lots and does not return.
    const state = await loginAction(values);
    if (!state) return;
    if (state.code === "email_unverified") {
      // The password was right, and the API has mailed a code: confirming it signs the dealer in.
      setUnconfirmed({ email: values.email, remember: values.remember });
      return;
    }
    if (state.captchaRequired) setCaptchaRequired(true);
    if (state.code === "invalid_credentials") {
      setValue("password", "");
      form.setFocus("password");
    }
    showServerErrors(form, state);
    setCaptchaReset((n) => n + 1);
  });

  if (unconfirmed) {
    return (
      <FieldGroup>
        <Alert>
          <AlertDescription>{m.auth.login.confirmToFinish}</AlertDescription>
        </Alert>
        <VerifyEmailForm
          email={unconfirmed.email}
          remember={unconfirmed.remember}
          onChangeEmail={() => setUnconfirmed(null)}
        />
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
        <PasswordField registration={register("password")} autoComplete="current-password" error={errors.password?.message} />
        <div className="flex items-center justify-between gap-4">
          <Field orientation="horizontal" className="w-auto">
            <Controller
              name="remember"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="remember"
                  name={field.name}
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  inputRef={field.ref}
                />
              )}
            />
            <FieldLabel htmlFor="remember" className="font-normal">
              {m.auth.login.remember}
            </FieldLabel>
          </Field>
          <Link href={localePath("/forgot-password", locale)} className="text-sm">
            {m.auth.login.forgot}
          </Link>
        </div>
        {captchaRequired && (
          <Turnstile action="login" resetSignal={captchaReset} onToken={(token) => setValue("captcha_token", token ?? "")} />
        )}
        <Button type="submit" disabled={isSubmitting} size="lg" className="w-full">
          {isSubmitting ? m.auth.login.pending : m.auth.login.submit}
        </Button>
        <FieldDescription className="text-center">
          {rich(m.auth.login.newHere, { link: <Link href={localePath("/register", locale)}>{m.auth.login.createAccount}</Link> })}
        </FieldDescription>
      </FieldGroup>
    </form>
  );
}
