"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { resetPasswordAction } from "@/app/(auth)/actions";
import { FormError } from "@/components/auth/FieldError";
import { showServerErrors } from "@/components/auth/form-helpers";
import { PasswordField } from "@/components/auth/PasswordField";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/auth-schemas";

export function ResetPasswordForm({ token }: { token: string }) {
  const [done, setDone] = useState(false);
  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    // A field is checked once it has been visited, then on every submit.
    mode: "onTouched",
    defaultValues: { token, password: "", password_confirm: "" },
  });
  const { register, handleSubmit, control, setFocus, formState } = form;
  const { errors, isSubmitting } = formState;
  const password = useWatch({ control, name: "password" });

  useEffect(() => setFocus("password"), [setFocus]);

  const onSubmit = handleSubmit(async (values) => {
    const state = await resetPasswordAction(values);
    if (state?.ok) setDone(true);
    else showServerErrors(form, state);
  });

  if (done) {
    return (
      <div role="status" className="form-stack">
        <p className="notice">Your password has changed, and every other session was signed out.</p>
        <Link href="/login" className="btn btn-primary w-full">
          Sign in with your new password
        </Link>
      </div>
    );
  }

  const serverError = errors.root?.server;
  return (
    <form onSubmit={onSubmit} noValidate className="form-stack">
      <FormError message={serverError?.message}>
        {serverError?.type === "invalid_token" && (
          <>
            {" "}
            <Link href="/forgot-password">Request a new link</Link>
          </>
        )}
      </FormError>
      <PasswordField
        registration={register("password")}
        label="New password"
        autoComplete="new-password"
        error={errors.password?.message}
        requirementFor={password}
      />
      <PasswordField
        registration={register("password_confirm")}
        label="Confirm new password"
        autoComplete="new-password"
        error={errors.password_confirm?.message}
      />
      <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full">
        {isSubmitting ? "Changing your password…" : "Change password"}
      </button>
    </form>
  );
}
