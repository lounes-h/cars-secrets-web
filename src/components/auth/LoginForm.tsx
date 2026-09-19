"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { loginAction } from "@/app/(auth)/actions";
import { FieldError, FormError } from "@/components/auth/FieldError";
import { showServerErrors, useRememberedEmail } from "@/components/auth/form-helpers";
import { PasswordField } from "@/components/auth/PasswordField";
import { Turnstile } from "@/components/auth/Turnstile";
import { loginSchema, type LoginInput } from "@/lib/auth-schemas";

export function LoginForm() {
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [captchaReset, setCaptchaReset] = useState(0);
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
    defaultValues: { email: "", password: "", remember: false, captcha_token: "" },
  });
  const { register, handleSubmit, setValue, formState } = form;
  const { errors, isSubmitting } = formState;
  useRememberedEmail(form, { empty: "email", filled: "password" });

  const onSubmit = handleSubmit(async (values) => {
    // On success the action redirects to /account and does not return.
    const state = await loginAction(values);
    if (!state) return;
    if (state.captchaRequired) setCaptchaRequired(true);
    if (state.code === "invalid_credentials") {
      setValue("password", "");
      form.setFocus("password");
    }
    showServerErrors(form, state);
    setCaptchaReset((n) => n + 1);
  });

  const serverError = errors.root?.server;
  return (
    <form onSubmit={onSubmit} noValidate className="form-stack">
      <FormError message={serverError?.message}>
        {serverError?.type === "email_unverified" && (
          <>
            {" "}
            <Link href="/verify-email">Send a new confirmation link</Link>
          </>
        )}
        {serverError?.type === "invalid_credentials" && (
          <>
            {" "}
            <Link href="/forgot-password">Reset your password</Link> if you do not remember it.
          </>
        )}
      </FormError>
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...register("email")}
        />
        <FieldError id="email-error" message={errors.email?.message} />
      </div>
      <PasswordField registration={register("password")} autoComplete="current-password" error={errors.password?.message} />
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <input id="remember" type="checkbox" {...register("remember")} />
          <label htmlFor="remember" className="mb-0 font-normal">
            Remember me
          </label>
        </div>
        <Link href="/forgot-password" className="text-sm">
          Forgot your password?
        </Link>
      </div>
      {captchaRequired && (
        <Turnstile action="login" resetSignal={captchaReset} onToken={(token) => setValue("captcha_token", token ?? "")} />
      )}
      <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full">
        {isSubmitting ? "Signing in…" : "Sign in"}
      </button>
      <p className="hint text-center">
        New here? <Link href="/register">Create an account</Link>
      </p>
    </form>
  );
}
