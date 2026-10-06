"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { loginAction } from "@/app/(auth)/actions";
import { FormError } from "@/components/auth/FormError";
import { showServerErrors, useRememberedEmail } from "@/components/auth/form-helpers";
import { PasswordField } from "@/components/auth/PasswordField";
import { Turnstile } from "@/components/auth/Turnstile";
import { VerifyEmailForm } from "@/components/auth/VerifyEmailForm";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { EMAIL_MAX, loginSchema, type LoginInput } from "@/lib/auth-schemas";

/** `remember` ticks the box when the last sign-in in this browser had it ticked. */
export function LoginForm({ remember = false }: { remember?: boolean }) {
  const [unconfirmed, setUnconfirmed] = useState<{ email: string; remember: boolean } | null>(null);
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [captchaReset, setCaptchaReset] = useState(0);
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
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
          <AlertDescription>Confirm your email address to finish signing in.</AlertDescription>
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
          <FieldLabel htmlFor="email">Email</FieldLabel>
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
              Remember me
            </FieldLabel>
          </Field>
          <Link href="/forgot-password" className="text-sm">
            Forgot your password?
          </Link>
        </div>
        {captchaRequired && (
          <Turnstile action="login" resetSignal={captchaReset} onToken={(token) => setValue("captcha_token", token ?? "")} />
        )}
        <Button type="submit" disabled={isSubmitting} size="lg" className="w-full">
          {isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
        <FieldDescription className="text-center">
          New here? <Link href="/register">Create an account</Link>
        </FieldDescription>
      </FieldGroup>
    </form>
  );
}
