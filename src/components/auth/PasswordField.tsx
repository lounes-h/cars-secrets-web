"use client";

import { useId, useState, type KeyboardEvent } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { useI18n } from "@/components/I18nProvider";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { PASSWORD_MAX, PASSWORD_RULES, ruleWords } from "@/lib/auth-schemas";

type Props = {
  registration: UseFormRegisterReturn;
  label?: string;
  autoComplete: "new-password" | "current-password";
  error?: string;
  /** The value typed so far, to tick the requirements live (new passwords only). */
  requirementFor?: string;
};

/** Password input with a show/hide toggle, a Caps Lock warning and, for new passwords, the requirements. */
export function PasswordField({ registration, label, autoComplete, error, requirementFor }: Props) {
  const { m } = useI18n();
  const words = m.auth.passwordField;
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
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={id}>{label ?? m.auth.password}</FieldLabel>
      <InputGroup>
        <InputGroupInput
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          maxLength={PASSWORD_MAX}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...registration}
          onFocus={() => setFocused(true)}
          onKeyDown={checkCaps}
          onKeyUp={checkCaps}
          onBlur={(event) => {
            setCapsLock(false);
            return registration.onBlur(event);
          }}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="sm"
            aria-pressed={visible}
            aria-controls={id}
            aria-label={visible ? words.hideLabel : words.showLabel}
            onClick={() => setVisible((v) => !v)}
          >
            {visible ? words.hide : words.show}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      {capsLock && <FieldDescription id={`${id}-caps`}>{words.capsLock}</FieldDescription>}
      {showRules && (
        <ul id={`${id}-rules`} className="text-sm text-muted-foreground">
          {PASSWORD_RULES.map((rule) => {
            const met = rule.test(typed);
            return (
              <li key={rule.key} className={met ? "font-medium text-foreground" : undefined}>
                {met ? "✓" : "•"} {ruleWords(m.auth, rule.key).text}
              </li>
            );
          })}
        </ul>
      )}
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </Field>
  );
}
