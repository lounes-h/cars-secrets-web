"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { resetPasswordAction } from "@/app/[lang]/(auth)/actions";
import { FormError } from "@/components/auth/FormError";
import { showServerErrors } from "@/components/auth/form-helpers";
import { PasswordField } from "@/components/auth/PasswordField";
import { useI18n } from "@/components/I18nProvider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { authSchemas, type ResetPasswordInput } from "@/lib/auth-schemas";
import { localePath } from "@/lib/i18n";

export function ResetPasswordForm({ token }: { token: string }) {
  const { locale, m } = useI18n();
  const words = m.auth.reset;
  const [done, setDone] = useState(false);
  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(authSchemas(m.auth).resetPasswordSchema),
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
      <FieldGroup>
        <Alert role="status">
          <AlertDescription>{words.done}</AlertDescription>
        </Alert>
        <Link href={localePath("/login", locale)} className={buttonVariants({ size: "lg", className: "w-full" })}>
          {words.signIn}
        </Link>
      </FieldGroup>
    );
  }

  const serverError = errors.root?.server;
  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <FormError message={serverError?.message}>
          {serverError?.type === "invalid_token" && (
            <>
              {" "}
              <Link href={localePath("/forgot-password", locale)}>{words.requestNewLink}</Link>
            </>
          )}
        </FormError>
        <PasswordField
          registration={register("password")}
          label={words.newPassword}
          autoComplete="new-password"
          error={errors.password?.message}
          requirementFor={password}
        />
        <PasswordField
          registration={register("password_confirm")}
          label={words.confirmPassword}
          autoComplete="new-password"
          error={errors.password_confirm?.message}
        />
        <Button type="submit" disabled={isSubmitting} size="lg" className="w-full">
          {isSubmitting ? words.pending : words.submit}
        </Button>
      </FieldGroup>
    </form>
  );
}
