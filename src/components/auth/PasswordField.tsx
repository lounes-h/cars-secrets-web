"use client";

import { useId, useState } from "react";
import { FieldError } from "@/components/auth/FieldError";

type Props = {
  name?: string;
  label?: string;
  autoComplete: "new-password" | "current-password";
  error?: string;
  minLength?: number;
};

/** Password input with a show/hide toggle; the toggle never submits the form. */
export function PasswordField({ name = "password", label = "Password", autoComplete, error, minLength }: Props) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        required
        minLength={minLength}
        maxLength={128}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      <button type="button" aria-pressed={visible} aria-controls={id} onClick={() => setVisible((v) => !v)}>
        {visible ? "Hide password" : "Show password"}
      </button>
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}
