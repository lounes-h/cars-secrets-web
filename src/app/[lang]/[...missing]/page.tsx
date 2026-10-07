import { notFound } from "next/navigation";

/**
 * Any path no page matches. With the root layout under [lang], Next would answer it with a bare
 * 404 of its own; this keeps it inside the layout, with the banner and the page's language.
 */
export default function Missing(): never {
  notFound();
}
