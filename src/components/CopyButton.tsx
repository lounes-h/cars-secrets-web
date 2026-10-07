"use client";

import { useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import { Button } from "@/components/ui/button";
import { fill } from "@/lib/i18n";

/** Copies a value (a VIN, a lot number) so the dealer can paste it into the auction's search. */
export function CopyButton({ value, label }: { value: string; label: string }) {
  const words = useI18n().m.lotPage;
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="link"
      size="xs"
      className="text-muted-foreground"
      aria-label={fill(words.copyLabel, { label })}
      onClick={() =>
        navigator.clipboard.writeText(value).then(
          () => setCopied(true),
          () => setCopied(false),
        )
      }
    >
      {copied ? words.copied : words.copy}
    </Button>
  );
}
