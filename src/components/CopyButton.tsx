"use client";

import { useState } from "react";

/** Copies a value (a VIN, a lot number) so the dealer can paste it into the auction's search. */
export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-link text-xs"
      aria-label={`Copy ${label}`}
      onClick={() =>
        navigator.clipboard.writeText(value).then(
          () => setCopied(true),
          () => setCopied(false),
        )
      }
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
