"use client";

import { useId, useState, type KeyboardEvent } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { FieldError } from "@/components/auth/FieldError";
import { PASSWORD_MAX, PASSWORD_RULES } from "@/lib/auth-schemas";

type Props = {
  registration: UseFormRegisterReturn;
  label?: string;
  autoComplete: "new-password" | "current-password";
  error?: string;
  /** The value typed so far, to tick the requirements live (new passwords only). */
  requirementFor?: string;
};

/** Password input with a show/hide toggle, a Caps Lock warning and, for new passwords, the requirements. */
export function PasswordField({ registration, label = "Password", autoComplete, error, requirementFor }: Props) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  // The requirements are noise until the field is someone's problem, so they appear on the
  // first focus and stay from then on.
  const [focused, setFocused] = useState(false);
  const checkCaps = (event: KeyboardEvent<HTMLInputElement>) => setCapsLock(event.getModifierState("CapsLock"));
  const showRules = requirementFor !== undefined && focused;
  const describedBy =
    [error && `${id}-error`, capsLock && `${id}-caps`, showRules && `${id}-rules`].filter(Boolean).join(" ") ||
    undefined;
  const typed = requirementFor ?? "";

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
          onFocus={() => setFocused(true)}
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
      {showRules && (
        <ul id={`${id}-rules`} className="hint mt-1">
          {PASSWORD_RULES.map((rule) => {
            const met = rule.test(typed);
            return (
              <li key={rule.text} className={met ? "font-medium text-ink" : undefined}>
                {met ? "✓" : "•"} {rule.text}
              </li>
            );
          })}
        </ul>
      )}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}
