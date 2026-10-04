# Security

## Current surface

Static SEO endpoints (robots, sitemap, llms.txt, images) and the auth pages. The
site stores no data: accounts, passwords and sessions live in the API, which this
site calls from the server only. See the API's `docs/security.md` for password
hashing, throttling, captcha and token rules.

## Session

- `cs_session` holds the API's session token: `HttpOnly`, `SameSite=Lax`,
  `Secure` in production, path `/`. With "remember me" it lasts 30 days;
  otherwise it ends with the browser session. The API also expires it after
  12 hours of inactivity. Only `src/lib/session.ts` sets or clears it.
- `cs_oauth_state` holds the social sign-in state for 10 minutes, on path
  `/auth/callback` only. In production it is `SameSite=None; Secure`, because
  Apple returns with a cross-site POST that a Lax cookie would not accompany.
  The callback refuses any state that does not match it.
- After sign-in the visitor is sent only to site-relative paths (`safePath`), so
  the redirect target cannot point to another site.
- `cs_tz` holds the browser's time zone name, set by the lot list's filter bar
  (`SameSite=Lax`, path `/`, a year). It is not secret and not `HttpOnly`: the server
  reads it only through `knownZone`, which accepts a zone `Intl` knows (64 characters
  at most), and uses it only to say when "today" is; the API checks it again.

## Forms and server actions

- Server actions are POST endpoints anyone can call. Next.js rejects requests
  whose `Origin` differs from the host (CSRF), and the session cookie is
  `SameSite=Lax`. Actions parse their input with the same Zod schemas as the
  forms before calling the API, which validates again; they return only messages
  and field errors, never tokens or user records.
- The lot list's actions need a session and trust nothing they are sent:
  `lotCountsAction` counts only filters named in `COUNTED`, and both it and
  `rememberLotFiltersAction` read the query through `readQuery`, which keeps only known
  parameters and values. The filters are kept in the API (at most 2000 characters), and
  a kept query passes through `readQuery` again before the page redirects to it, always
  to `/active-lots`. The browser never calls the API.
- `/auth/session` returns only the signed-in user's first name and email, with
  `Cache-Control: private, no-store`, for the banner.
- The email typed in an auth form is kept in sessionStorage for the tab, never
  in a URL, so it does not reach server logs or referrers.
- The reset link (`/reset-password`) needs a click to use its token, so link
  scanners cannot consume it. Email confirmation has no link at all: the API mails
  a six-digit code, typed into `/verify-email` or the step that replaces the
  register and sign-in forms. The code and the address never go in a URL, and
  `verifyEmailAction` accepts only six ASCII digits before calling the API. How
  guesses are limited (per code, per address, per client) is the API's business;
  see its `docs/security.md`. Those pages are `noindex`.
- Register, forgot-password and resend-confirmation show the same message
  whether or not the email has an account, and a wrong code reads the same
  whether or not the address exists.

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

- `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_TURNSTILE_SITE_KEY` are public. They
  are inlined into the client bundle, so never put a secret in a
  `NEXT_PUBLIC_*` variable.
- `API_URL` and `API_INTERNAL_KEY` are server-only. `API_URL` defaults to
  `http://localhost:8001`; set it explicitly for a hosted API. `API_INTERNAL_KEY` is a
  secret shared with the API: with it, the API trusts the visitor address this
  server forwards for rate limiting.
- The Turnstile widget loads its script from `challenges.cloudflare.com`. The
  Content-Security-Policy sets no `script-src` or `frame-src`, so it needs no
  change; add that host if those directives are introduced.
- `.env*` files are gitignored except `.env.example`.

## Structured data

JSON-LD is written inline with `dangerouslySetInnerHTML`, always through
`serializeJsonLd`, which escapes `<` so that content cannot break out of the
`<script>` element.
