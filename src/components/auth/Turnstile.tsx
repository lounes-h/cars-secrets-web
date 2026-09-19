"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: { render: (el: HTMLElement, options: { sitekey: string; action?: string }) => string };
    onloadTurnstileCallback?: () => void;
  }
}

const SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback&render=explicit";

/**
 * Cloudflare Turnstile widget. It adds a hidden `cf-turnstile-response` input to the form,
 * which the server action forwards to the API. Renders nothing while no site key is set.
 */
export function Turnstile({ action }: { action: string }) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!siteKey) return;
    const render = () => {
      const el = container.current;
      if (el && window.turnstile && !el.hasChildNodes()) window.turnstile.render(el, { sitekey: siteKey, action });
    };
    if (window.turnstile) render();
    else window.onloadTurnstileCallback = render;
  }, [siteKey, action]);

  if (!siteKey) return null;
  return (
    <>
      <Script src={SCRIPT} strategy="afterInteractive" />
      <div ref={container} data-testid="turnstile" />
    </>
  );
}
