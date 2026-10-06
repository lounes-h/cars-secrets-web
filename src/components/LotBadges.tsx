import { CheckIcon, DotIcon, TriangleAlertIcon, XIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { badges } from "@/lib/lot-signals";
import type { Lot } from "@/lib/lots";
import { cn } from "cn";

const TONE_ICONS = { good: CheckIcon, warn: TriangleAlertIcon, bad: XIcon, neutral: DotIcon } as const;

const TONE_COLORS = {
  good: "border-good/40 bg-good-bg text-good",
  warn: "border-warn/40 bg-warn-bg text-warn",
  bad: "border-bad/40 bg-bad-bg text-bad",
  neutral: "bg-muted text-muted-foreground",
} as const;

/** The lot's deal breakers as badges, each with an icon and words, never colour alone. Shared by the lot page and the lot card. */
export function LotBadges({ lot, className, badgeClassName }: { lot: Lot; className?: string; badgeClassName?: string }) {
  return (
    <ul aria-label="Deal breakers" className={cn("flex flex-wrap gap-2", className)}>
      {badges(lot).map((badge) => {
        const Tone = TONE_ICONS[badge.tone];
        return (
          <Badge key={badge.label} render={<li />} variant="outline" data-tone={badge.tone} className={cn(TONE_COLORS[badge.tone], badgeClassName)}>
            <Tone aria-hidden="true" />
            {badge.label}
          </Badge>
        );
      })}
    </ul>
  );
}
