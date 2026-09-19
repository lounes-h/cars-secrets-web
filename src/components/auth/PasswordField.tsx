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
      <div className="relative">
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
        className="pr-20"
      />
        <button
          type="button"
          aria-pressed={visible}
          aria-controls={id}
          aria-label={visible ? "Hide password" : "Show password"}
          onClick={() => setVisible((v) => !v)}
          className="btn btn-link absolute top-1/2 right-1 -translate-y-1/2"
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}
