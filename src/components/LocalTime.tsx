"use client";

import { useId } from "react";

/** Every time names its zone, so a reader never has to guess whose clock it is. */
const FORMATS = {
  // "Sep 18, 2026, 2:00 PM CDT"
  full: { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" },
  // "Fri, Sep 18, 2:00 PM CDT": a sale is days away at most, so the weekday says more than the year.
  sale: { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" },
} satisfies Record<string, Intl.DateTimeFormatOptions>;

/**
 * A moment in the reader's own time zone, which the server cannot know. The server writes it in
 * its own zone and the inline script rewrites it in the browser's before the first paint; after
 * a client-side navigation the browser renders it directly. This is the pattern in Next's
 * "Preventing flash before hydration" guide.
 */
export function LocalTime({ value, format = "full" }: { value: string | null; format?: keyof typeof FORMATS }) {
  const id = useId();
  if (!value) return "—";
  const options = FORMATS[format];
  // The script gets a number, never the API's string, so nothing from it lands in the page's code.
  const ms = new Date(value).getTime();
  const rewrite = `document.getElementById(${JSON.stringify(id)}).textContent=new Intl.DateTimeFormat("en-US",${JSON.stringify(options)}).format(${ms})`;
  return (
    <>
      <time id={id} dateTime={value} suppressHydrationWarning>
        {new Intl.DateTimeFormat("en-US", options).format(ms)}
      </time>
      <script
        // Only the server's HTML runs it; in the browser React renders it inert, and warns otherwise.
        type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: rewrite }}
      />
    </>
  );
}
