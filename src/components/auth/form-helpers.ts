"use client";

import { useEffect } from "react";
import { useWatch, type FieldValues, type Path, type UseFormReturn } from "react-hook-form";
import type { FormState } from "@/app/(auth)/actions";
import { readRememberedEmail, rememberEmail } from "@/lib/remembered-email";

/**
 * Puts a server action's answer on the form: field errors on their inputs (the first one gets
 * focus), anything else as a form-level message under `errors.root.server`.
 */
export function showServerErrors<T extends FieldValues>(form: UseFormReturn<T>, state: FormState | undefined) {
  const fields = Object.entries(state?.errors ?? {});
  fields.forEach(([field, message], index) => {
    form.setError(field as Path<T>, { type: "server", message }, { shouldFocus: index === 0 });
  });
  if (state?.message && (fields.length === 0 || state.code !== "validation")) {
    form.setError("root.server", { type: state.code ?? "server", message: state.message });
  }
}

/**
 * Fills the email field with the address typed earlier in this tab, and remembers whatever the
 * visitor types. Then focuses `focus.filled` when an address was known, else `focus.empty`
 * (e.g. sign in jumps straight to the password).
 */
export function useRememberedEmail<T extends FieldValues & { email: string }>(
  form: UseFormReturn<T>,
  focus: { empty: Path<T>; filled: Path<T> } = { empty: "email" as Path<T>, filled: "email" as Path<T> },
) {
  const { control, getValues, setValue, setFocus } = form;
  const email = useWatch({ control, name: "email" as Path<T> }) as string | undefined;
  const { empty, filled } = focus;

  useEffect(() => {
    const saved = readRememberedEmail();
    const field = "email" as Path<T>;
    if (saved && !getValues(field)) setValue(field, saved as T[Path<T>]);
    setFocus(saved ? filled : empty);
  }, [getValues, setValue, setFocus, empty, filled]);

  useEffect(() => {
    if (email) rememberEmail(email);
  }, [email]);
}
