"use client";

import { useId, useState, type KeyboardEvent } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { FieldError } from "@/components/auth/FieldError";
import { hasSpecialCharacter, PASSWORD_MAX, PASSWORD_MIN } from "@/lib/auth-schemas";

type Props = {
  registration: UseFormRegisterReturn;
  label?: string;
  autoComplete: "new-password" | "current-password";
  error?: string;
  /** The value typed so far, to show the length requirement live (new passwords only). */
  requirementFor?: string;
};

/** Password input with a show/hide toggle, a Caps Lock warning and, for new passwords, the requirement. */
export function PasswordField({ registration, label = "Password", autoComplete, error, requirementFor }: Props) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const checkCaps = (event: KeyboardEvent<HTMLInputElement>) => setCapsLock(event.getModifierState("CapsLock"));
  const describedBy =
    [error && `${id}-error`, capsLock && `${id}-caps`, requirementFor !== undefined && `${id}-rule`]
      .filter(Boolean)
      .join(" ") || undefined;
  const typed = requirementFor ?? "";
  const rules = [
    { met: typed.length >= PASSWORD_MIN, text: `At least ${PASSWORD_MIN} characters (${typed.length}/${PASSWORD_MIN})` },
    { met: hasSpecialCharacter(typed), text: "At least one special character" },
  ];

  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          maxLength={PASSWORD_MAX}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className="pr-20"
          {...registration}
          onKeyDown={checkCaps}
          onKeyUp={checkCaps}
          onBlur={(event) => {
            setCapsLock(false);
            return registration.onBlur(event);
          }}
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
      {capsLock && (
        <p id={`${id}-caps`} className="hint mt-1">
          Caps Lock is on.
        </p>
      )}
      {requirementFor !== undefined && (
        <ul id={`${id}-rule`} className="hint mt-1">
          {rules.map((rule) => (
            <li key={rule.text} className={rule.met ? "text-green-700 dark:text-green-400" : undefined}>
              {rule.met ? "✓" : "•"} {rule.text}
            </li>
          ))}
        </ul>
      )}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}
