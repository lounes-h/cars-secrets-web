# Security

## Current surface

The site has no pages yet, only static SEO endpoints (robots, sitemap, llms.txt, images). There are no accounts, no forms, no
database, no cookies set by the app and no API routes. No household or user
data is stored or returned.

## HTTP headers

`next.config.ts` applies these headers to every response:

| Header | Value |
|---|---|
| Strict-Transport-Security | `max-age=63072000; includeSubDomains` (add `preload` only once the production domain is final) |
| X-Content-Type-Options | `nosniff` |
| Referrer-Policy | `strict-origin-when-cross-origin` |
| X-Frame-Options / CSP `frame-ancestors` | deny framing |
| Content-Security-Policy | `frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'` |
| Permissions-Policy | camera, microphone, geolocation and topics disabled |

`poweredByHeader` is off.

## Environment

- `NEXT_PUBLIC_SITE_URL` is the only variable, and it is public. It is inlined
  into the client bundle, so never put a secret in a `NEXT_PUBLIC_*` variable.
- `.env*` files are gitignored except `.env.example`.

## Structured data

JSON-LD is written inline with `dangerouslySetInnerHTML`, always through
`serializeJsonLd`, which escapes `<` so that content cannot break out of the
`<script>` element.
