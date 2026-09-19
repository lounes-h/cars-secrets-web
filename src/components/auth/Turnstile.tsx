"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";

type TurnstileOptions = {
  sitekey: string;
  action?: string;
  callback?: (token: string) => void;
  "expired-callback"?: () => void;
};

declare global {
  interface Window {
    turnstile?: { render: (el: HTMLElement, options: TurnstileOptions) => string; reset: (widgetId: string) => void };
    onloadTurnstileCallback?: () => void;
  }
}

const SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback&render=explicit";

type Props = {
  action: string;
  /** The solved token, or null when it expired or was reset. */
  onToken: (token: string | null) => void;
  /** Change it to get a fresh challenge (tokens are single use, so after each failed submit). */
  resetSignal?: number;
};

/** Cloudflare Turnstile widget. Renders nothing while no site key is set. */
export function Turnstile({ action, onToken, resetSignal = 0 }: Props) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const container = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);

  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    if (!siteKey) return;
    const render = () => {
      const el = container.current;
      if (!el || !window.turnstile || widget.current !== null) return;
      widget.current = window.turnstile.render(el, {
        sitekey: siteKey,
        action,
        callback: (token) => onTokenRef.current(token),
        "expired-callback": () => onTokenRef.current(null),
      });
    };
    if (window.turnstile) render();
    else window.onloadTurnstileCallback = render;
  }, [siteKey, action]);

  useEffect(() => {
    if (resetSignal && widget.current !== null) {
      window.turnstile?.reset(widget.current);
      onTokenRef.current(null);
    }
  }, [resetSignal]);

  if (!siteKey) return null;
  return (
    <>
      <Script src={SCRIPT} strategy="afterInteractive" />
      <div ref={container} data-testid="turnstile" />
    </>
  );
}
