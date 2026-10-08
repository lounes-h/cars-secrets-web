# Web app (cars-secrets-web)
A dealer-focused vehicle auction intelligence platform that aggregates active listings from Copart, IAA, Manheim, and other auction sources into one searchable interface. The platform helps dealers identify the best vehicles to buy by showing current auction data, estimated resale value, total acquisition cost, repair/transport estimates, projected profit, profit margin, and a suggested maximum bid. Users can search and filter inventory, view detailed vehicle analysis, save vehicles and searches, and receive alerts. Bidding is not handled by the platform; users are redirected to the original auction site to place bids.

## Project specification
read `docs/project-specification.md`

## Tech stack

- Next.js 16 (App Router) with React 19 and TypeScript, server-rendered and
  statically prerendered.
- Tailwind CSS 4 and shadcn/ui (the `base-nova` style: Base UI primitives,
  lucide icons, `cn` for class merging; `components.json`). Its components are
  copied into `src/components/ui` and its theme tokens are CSS variables in
  `src/app/globals.css`. Black, grey and white only (shadcn's `neutral`), in
  Work Sans (`next/font/google`, self-hosted at build time, set on `<html>` in
  the root layout and put first in `--font-sans` in `src/app/globals.css`).
- Yarn 4 through Corepack (`packageManager` in `package.json`), with the
  `node-modules` linker.
- Vitest with Testing Library for unit tests, V8 coverage with a 95 % minimum.
- Accounts and data come from the Python API (`../cars-secrets-api`). Server
  actions and route handlers call it from the server through `src/lib/api.ts`;
  the browser never talks to the API.
- Hosting is not chosen yet.

Next 16 differs from older versions. Before using an API, read the bundled docs
in `node_modules/next/dist/docs/`.

## Commands

```bash
corepack enable      # once per machine
yarn install
yarn dev             # http://localhost:3000 (API defaults to localhost:8001; override API_URL in .env.local)
yarn lint
yarn typecheck       # next typegen && tsc --noEmit
yarn test            # vitest run
yarn test:coverage   # the same, failing below 95 % coverage
yarn build && yarn start
```

`next dev` reads `src/proxy.ts` only when it starts: after pulling a change that adds,
moves or renames it, or that moves the `src/app/[lang]` tree, stop `yarn dev` and start it
again. A server left running keeps answering every unprefixed page ("/active-lots") with a 404.

Run `yarn lint && yarn typecheck && yarn test:coverage && yarn build` before committing.
GitHub Actions runs the same four checks on every pull request and on pushes
to `main` (`.github/workflows/ci.yml`), checks that a pull request's commit
subjects are conventional, and releases each push to `main` that passes (see
Versioning).

## Architecture rules (important)

See `docs/architecture.md` for details.

- The site speaks English (`en`, the default) and US Spanish (`es`): `LOCALES` in
  `src/lib/i18n.ts`, each with its BCP 47 tag (`en-US`, `es-US`, for `<html lang>`,
  hreflang and every `Intl` format) and its name in itself ("English (United States)",
  "Español (Estados Unidos)"). Every page lives under `src/app/[lang]`. English has
  no prefix ("/active-lots", rewritten to `/en/…` by `src/proxy.ts`); Spanish is
  "/es/active-lots". The proxy keeps the `cs_locale` cookie on the language last
  browsed in: a visit to /es/… remembers Spanish, /en/… (only the language dialog
  links there) remembers English and drops the prefix, and an unprefixed page goes
  to /es/… while Spanish is remembered. Server actions cannot see the page's URL,
  so they read that cookie (`actionI18n`). Link and redirect to
  `localePath(path, locale)`, never to a bare path.
- Every word the site shows is in `src/messages/en.ts`, and `src/messages/es.ts`
  is typed against it, so a missing or extra key fails the type check
  (`messages.test.ts` also compares the placeholders). Never write UI text in a
  component. `{name}` is filled by `fill` (text) or `rich` (elements), and a count
  chooses `{ one, other }` through `plural`; numbers, money and dates go through
  `Intl` with the language's tag. Async Server Components read
  `await getI18n()` (`src/lib/i18n-server.ts`, from the `[lang]` segment through
  `next/root-params`), client components `useI18n()`
  (`src/components/I18nProvider.tsx`, filled by the root layout with the page's
  dictionary only), and other server components take the `i18n` (or `m`) their
  page passes them. Auction data (makes, damage, Copart's title wording) is shown
  as the auction gives it, untranslated. A dynamic key (an API code, a URL value)
  is looked up with `lookup`, never `map[key]`.
- Register every public page in `src/lib/routes.ts`, and its title and
  description in each language's `pages`. The sitemap (every page in every
  language, each naming the others) and llms.txt (English) are generated from
  that registry, and a test fails when a `page.tsx` under `src/app/[lang]` is
  missing from it. A dynamic route behind sign-in has no place in
  the registry (there is no one path to register): it builds its metadata with
  `buildMetadata({ noindex: true })` in `generateMetadata` instead, as
  `/active-lots/[source]/[lotNumber]` does.
- Build page metadata with `metadataForRoute()` or `buildMetadata()` from
  `src/lib/seo/metadata.ts`, in a `generateMetadata` (the words depend on the
  page's language). Never hand-write `title`, canonical, language alternates or
  Open Graph metadata.
- There is no structured data: schema.org needs a brand name, and there is
  none yet. Add the builders back with the brand.
- Each page has one `h1`. Its lede answers the page's question directly, so
  search engines and AI assistants can quote it. The auth pages are the
  exception: heading and form only, no lede — their registered description
  carries the answer.
  `/active-lots` is one too: it opens on the search, so its `h1` is visually
  hidden (`sr-only`) and it has no lede; its registered description carries
  the answer.
- The layout is full width: no centered `max-w-*` page container. Sections
  span the viewport with side padding (`px-4 sm:px-6 lg:px-8`: 16, 24, 32px), and only
  running text is capped at a readable measure (`max-w-[65ch]`). Auth pages
  are the exception: their form sits in a `Card` in one centered 28rem column
  (`max-w-md`), because a full-width form is hard to fill in.
- Every control is a shadcn/ui component from `src/components/ui`: `Button`
  (a link styled as one is `<Link className={buttonVariants(...)}>`, which stays
  a real link — Base UI's `render` would give it `role="button"`), `Input`,
  `Field` (label, description, error), `InputGroup` (password show/hide, phone
  country and number), `Checkbox`, `RadioGroup`, `NativeSelect`, `Card`,
  `Alert`, `Badge`, `Table`, `Tabs`, `Slider`, `Popover`, `Sheet`, `Dialog`, `Collapsible`,
  `DropdownMenu`, `Avatar` and `Separator`; icons come from `lucide-react`. Add
  one with `npx shadcn@latest add <name>`, then delete the exports nothing uses
  (coverage counts them). Style with Tailwind utilities on the theme tokens;
  there are no hand-written component classes. Text inputs (`input.tsx`, and
  `input-group.tsx` for the password and phone fields) are 48px tall with an 8px
  radius, and focus only darkens their 1px border (`border-primary`), with no
  ring; an invalid one has a black border, also without a ring. A `NativeSelect` is
  48px too (40px with `size="sm"`), with the same radius and focus. Buttons keep to
  one scale: `sm` 32px for chips beside text, the default 40px (the menu, View
  details, pagination, Show filters, the sort), and `lg` 48px for a button on a row
  with a 48px field (Search, the filter bar, Apply, the filter sheet's buttons), for
  the lot page's way to the auction ("View on Copart", "Buy now") and for the auth
  pages' buttons (submit, Google and Apple, "Sign out"); their inline text links are
  not. There is no size above 48px. The password field's Show/Hide is 32px. `buttonVariants` returns its classes
  merged through `cn`, so an outline link keeps its border (otherwise the base's
  `border-transparent` wins). Every other control shows keyboard focus as a solid
  3px `--ring` outline (`focus-visible:ring-3 focus-visible:ring-ring`, never a faded
  `ring-ring/50`). A card is a 1px `border`, 12px corners and 24px padding (16px
  with `size="sm"`), flat; its heading is `CardTitle` (an `h2`, 18px semibold).
  Keep these if a component is re-added with `--overwrite`. A Base UI checkbox or radio is a
  `span` named through `aria-labelledby`, so its `id` must hold no whitespace
  (`LotFilters` encodes option values).
- The design tokens live in `src/app/globals.css`, and nothing steps off them:
  Tailwind's 4px spacing grid and its type scale (12, 14, 16, 18, 20, 24, 30, 36px;
  weights 400–700), radii of 4px (checkboxes), 6px (items inside a control and 32px
  buttons), 8px (controls, buttons, popovers), 12px (cards) and 16px, and pills
  `rounded-full`. Borders come in three strengths: `--border` for dividers and
  cards, `--input` a step darker for controls, and `--primary` for a focused field.
  Only what floats (popovers, menus, the sheet, the dialog) has a shadow. Text is
  `--foreground` or, for what is secondary, `--muted-foreground` (#636363, at least
  5:1 on white and on `--muted`). `src/components/ui/design-system.test.ts` fails on
  an arbitrary font size, radius or control height, a weight outside 400–700, a
  faded focus ring or the old 40px gutter.
- There is no favicon or share image yet, and no dark mode (`globals.css` keeps
  the `dark` variant on a `.dark` class nothing sets, so the components' `dark:`
  styles never apply).
  The one logo is the CarBidInsight wordmark in the banner (`public/logo.png`,
  384×64, shown at 192×32 and served as is, unoptimized); its navy and green
  are the logo's own, not tokens. The interface uses black, grey and white
  only, through shadcn's tokens (`--background`, `--foreground`, `--primary`,
  `--muted`, `--muted-foreground`, `--border`, …) in `src/app/globals.css`.
  There is no error colour: `--destructive` is the text colour, so errors
  (`FieldError`, `FormError`) read as bold text. The one exception is the
  deal-breaker badges (`LotBadges`, on the lot page and each lot card) and the lot page's
  sale countdown: `--good`, `--warn` and `--bad`
  (with `-bg` variants, as `text-good`, `bg-good-bg`, …) colour them green,
  amber and red, and every badge also carries an icon and words, never colour
  alone. The base layer styles only `h1` and running-text links (an `<a>`
  without a `data-slot`; button-styled links drop the underline). Add no
  further branding until a design exists.
- The top banner (`src/components/SiteBanner.tsx`) is rendered by the root
  layout on every page and links home with the logo. Its navigation
  (`src/components/AccountNav.tsx`) is a client component that asks
  `/auth/session` after each navigation and renders both the main menu and the
  account side: Active lots, VIN Lookup, then How It Works and Pricing
  with "Sign in" and the "7 days free trial" button for visitors, or Saved and
  Alerts with the dealer's initials in a round button once signed in. Alerts
  carries how many alerts are unread (`/auth/session` returns the count), and so
  do the initials below `lg`. That
  button opens the account menu, a `DropdownMenu` (a click outside or Escape
  closes it, and so does following one of its links): the initials, the full
  name and the email, then Saved and Alerts (below `lg` only, where the main menu
  is hidden), Settings, Account and Log out, which calls
  `logoutAction` directly, and last the language in use ("English (United
  States)", with the earth icon). Visitors get the language as an earth button
  at the right end of the banner, after the free trial. Both open the language
  dialog (`src/components/LanguageDialog.tsx`): "Choose a language:" and each
  language, named in itself, as a plain link to the same page in it (query
  included), so the page reloads in the new language. Best Buys is
  left out of the menu for now, though its page exists. The current page's
  item is marked (`aria-current`, the ghost button's grey hover kept on), on
  the pages under it too: a lot's page marks Active lots. The menu is
  hidden below `lg`. On `/register` and `/login` the navigation renders
  only the earth button, so the banner is the logo and the language. Never read
  the session or a cookie in the root layout: it would make every page dynamic
  (it reads only its `[lang]` segment, so each page is prerendered once per language).
- Pages are Server Components and stay static. Add `"use client"` only where
  interaction needs it. Pages that read the session (`/register`, `/login`,
  `/account`, `/saved`, `/alerts`, `/settings`) or a token from the URL are dynamic by
  necessity.
- Auth lives in the `src/app/[lang]/(auth)` route group: `actions.ts` holds every auth
  server action, the pages sit next to it, and `/account` sits outside it.
  Forms use React Hook Form with Zod (`src/lib/auth-schemas.ts`): the same
  schema, built for the page's language by `authSchemas(m.auth)`, validates in
  the browser and again in the server action, and the form
  keeps its values when the server answers with errors
  (`showServerErrors` in `src/components/auth/form-helpers.ts`). Actions take
  the form's values as an object, not `FormData`. Only the social buttons post
  a plain form (`socialLoginAction`).
- Auth forms validate a field once the cursor has left it (`mode: "onTouched"`)
  and again on submit. Every input carries the limit its schema enforces
  (`NAME_MAX`, `EMAIL_MAX`, `PASSWORD_MAX`). A new password must satisfy every
  entry of `PASSWORD_RULES` in `src/lib/auth-schemas.ts` — at least
  `PASSWORD_MIN` (8) characters, one letter, one number and one special
  character (`hasSpecialCharacter`). That one list is both the checklist the
  form shows and the validation the schema applies, so add a rule there (and its
  words in `passwordRules`) and nowhere else; the API applies the same rules. The checklist appears on the
  password field's first focus and stays from then on, so it is not noise
  before the dealer reaches the field.
- The register form picks the phone's country from the browser's time zone,
  falling back to its languages (`countryFromBrowser`), over the server's
  Accept-Language guess. The country's own example number (generated
  `src/lib/phone-formats.ts`) is the placeholder, the shape the typed digits
  are formatted into and the ceiling they stop at (`formatNational`), and the
  lengths the number is checked against (`isValidNationalNumber`). A number
  pasted in international form ("+1 (551) 358-8130") loses its calling code
  instead of having it formatted into the national shape.
- A complete email address typed in any auth form is remembered for the tab
  (`src/lib/remembered-email.ts`, sessionStorage; half-typed ones are not) and
  prefilled in the others. Entering a confirmation code or signing out forgets it (`forgetEmail`,
  called from the browser, since a server action cannot reach its storage)
  through `useRememberedEmail`. Never put it in a URL.
- The session is the API's token in the httpOnly `cs_session` cookie, set and
  cleared only through `src/lib/session.ts`. Read the signed-in user with
  `currentUser()`; never decode or trust the cookie in the browser.
- Social sign-in returns to `src/app/auth/callback/[provider]/route.ts`
  (GET for Google, POST for Apple), which checks the `cs_oauth_state` cookie.
- Pages that must not be indexed (token links, the account page) are still
  registered, with `noindex: true`: they are left out of the sitemap and
  marked noindex.
- Deal arithmetic (cost, profit, margin, max bid) lives only in
  `src/lib/deal.ts`.
- The lot list's search and filters live in one table, `FILTERS` in
  `src/lib/lot-filters.ts`: each filter's group, kind and options, its words in the
  messages' `filters`. The URL is the
  state, and its parameters are the API's own (`/api/lots`), so a valid query string passes
  straight through; `readQuery` keeps only what the table allows, so add a filter there and in
  the API's `LotFilters` (and its words in each language), nowhere else. The bar always writes an order (`sort`), so a URL
  without parameters means "as I left it".
- Never publish invented statistics, testimonials, reviews or prices. The one
  temporary exception is the lot page's premium sections: their figures come from `SAMPLE`
  in `src/lib/premium-sample.ts` and their words from the messages' `premium.sample`, are
  the same on every lot, and each section says so (`premium.sampleNote`, or the calculator's
  cost/profit note). The likely final bid
  comes from the API's `predicted_final_price`; it is not a sample. Remaining samples go,
  section by section, as the real analysis arrives.

## Security rules

See `docs/security.md`. Security headers are set in `next.config.ts`. Public
environment variables are `NEXT_PUBLIC_SITE_URL` and
`NEXT_PUBLIC_TURNSTILE_SITE_KEY`; `API_URL` and `API_INTERNAL_KEY` are
server-only, and secrets never use the `NEXT_PUBLIC_` prefix. Every server
action is an untrusted entry point: validate its input and let the API decide.
Only redirect to site-relative paths (`safePath`).

## Migrations

This repository has no database. Accounts are stored and migrated by the API.

## Tests

Tests sit next to the code as `*.test.ts(x)` under `src/`. They run in the node
environment by default. Component tests opt into jsdom with
`// @vitest-environment jsdom`. `vitest.config.mts` sets
`NEXT_PUBLIC_SITE_URL=https://cars-secrets.test` so that URLs are deterministic,
and `TZ=UTC` so that times are. `src/test-setup.ts` stands in for
`next/root-params`, so pages render in English unless a test says
`vi.mocked(lang).mockResolvedValue("es")`; a client component without an
`I18nProvider` around it renders in English, and a test wraps it in one for
Spanish.

**Minimum test coverage is 95 %** of statements, branches, functions and lines
across `src/`. `yarn test:coverage` fails below it (thresholds in
`vitest.config.mts`), and CI runs that command, so a pull request that drops
coverage under 95 % fails. Cover new code in the same change; never lower the
thresholds or exclude files to get a change through.

## Unit Test Requirements

Whenever you make any change to application code, you must add or update unit tests that cover the changed behavior.

This applies to:

- New features
- Bug fixes
- Refactors
- Business logic changes
- Validation changes
- Error handling changes
- API behavior changes
- Utility/helper changes
- Data transformation changes

For every code change:

1. Identify the behavior that changed.
2. Add or update unit tests covering that behavior.
3. Include success, failure, and edge cases when relevant.
4. Run the relevant unit tests.
5. Make sure existing related tests still pass.

### Bug fixes

When fixing a bug, add a regression test that:

1. Reproduces the incorrect behavior.
2. Would fail before the fix.
3. Passes after the fix.

### Refactors

If existing tests already fully cover the affected behavior, new tests are not required solely because code was refactored.

However, if coverage is missing or weak, add the necessary tests.

### Exceptions

Unit tests may be skipped only when they are not reasonably applicable, such as:

- Documentation-only changes
- Comment-only changes
- Formatting-only changes
- Static asset changes
- Pure configuration changes with no testable code behavior

Do not skip tests simply because a change is small.

If no unit test is added, explicitly explain why in the final response.

A code change is not considered complete until the relevant unit tests have been added or updated and executed successfully.

## Current state

The pages are the auth pages (`/register`, `/login`, `/forgot-password`,
`/reset-password`, `/verify-email`, `/account`), `/active-lots` (the lot listing),
`/saved`, `/alerts` and `/settings` (saved lots, searches and alerts, below)
and the empty placeholders the banner menu links to: `/vin-lookup`,
`/how-it-works` and `/pricing`, plus `/best-buys`, which the menu
leaves out for now — blank white
pages with metadata only, so they have no `h1` until there is something to put
on them. Every page exists in English and in Spanish (see the languages rule). A
path no page matches (`[lang]/[...missing]`) and a lot the API no longer has are
a 404 under the banner, in the page's language (`[lang]/not-found.tsx`); its tab
keeps the home page's title, since only a `global-not-found` can set its own.
Styling is shadcn/ui's components on the flat, grayscale design tokens above, until a
brand design exists. `/` is the home page: the
centred title "Everything You Need to Know Before Buying a Car at Auction" and
nothing else yet. Add no other pages until the user asks.

**The brand is CarBidInsight, and so far only the banner's logo carries it.**
The logo links home, its alt text the name. `src/lib/site.ts` holds only the
URL, and the site's description is the messages' `site.description`; page titles stand alone (no
"| Name" suffix) and `llms.txt` is headed by the site host (`siteHost`), until
the user asks for the name there. The repository and the API keep their
`cars-secrets-*` names, and so does the `cars-secrets.test` origin the tests
run against. Invent no slogan.

In place: the Next.js, Yarn 4, Tailwind, shadcn/ui and Vitest setup; the root layout
(grayscale tokens and the full-width top banner); the SEO builders (metadata,
sitemap, robots, llms.txt); `robots.txt` with AI crawlers allowed; security
headers; the deal calculation in `src/lib/deal.ts`; the banner's logo; and automatic
versioning (see Versioning).
There is no favicon, touch icon, web app manifest, share image or structured data.

In place for accounts: registration (names, email, optional phone with every
country's flag and calling code, password with show/hide, Turnstile captcha),
email confirmation by a six-digit emailed code that also signs the dealer in (one numeric
field that takes pastes and one-time-code autofill, a new code after 60 seconds), sign-in with remember me (captcha after
repeated failures; the box comes back as the last sign-in left it, through the
`cs_remember` cookie that sign-out keeps), landing on `/active-lots` like every
other sign-in, sign-out, forgot and reset password, and Google and Apple
buttons. The API answers "not configured" for Google and Apple until their
credentials are set. There is no terms checkbox: the button reads "Agree and
register" and a sentence above it says that clicking it is the agreement, so the
action always tells the API the terms are accepted. The Terms of Use and Privacy
Policy themselves do not exist yet.

In place for lots: `/active-lots` ("Active lots" in the menu and as its visually hidden `h1`; the
path was `/auctions`, which redirects here permanently) lists active lots, the most recently listed
first unless the dealer picks another order, 20 to a page (`?page=`), each as a card
(`src/components/LotCard.tsx`, answering "is this lot worth opening?"), with search and filters
(below), under a light grey strip that says how many lots were added and updated today — or in
the last 3 or 7 days when today has fewer than 1,000 (`activityWindow`) — and `/active-lots/[source]/[lotNumber]` shows one lot —
every column the ingest keeps for it, every photo of it, and a way to the lot on the
auction's site, since bidding never happens here. The page reads top to bottom as: a summary (title, lot number and VIN
with copy buttons, the time left before the sale — "Future sale" when the auction has set no
sale day yet, as Copart calls it — Save / Saved and Remind me with the reminders' status and,
once saved, the change alerts (`LotWatch`, below), a "View on Copart" button (the auction's name from
`auctionName` in `src/lib/lots.ts`) to the lot on the auction's site, with "Bidding happens on
Copart's own site." under it, a meta line (mileage, drive as a
dealer says it — FWD, RWD, AWD, 4WD, from `driveType` — "Primary damage: …" and "Secondary damage: …", the latter "N/A" when the auction gives none, location) and
the deal-breaker badges, with no sentence repeating them, in a fixed order: run status, keys, title, then odometer
only when it is not the normal case, then sale status always — pure sale, minimum bid, seller must approve — then
the seller: "Insurance seller" (green) or "Not an insurance seller", and no badge when the seller is not stated — then "Offsite" (amber) when the auction holds the lot away from its yard); the gallery (Photos and Damage map tabs) beside the
Deal calculator, the one emphasised card, which took the all-in cost card's place: the lot's
`predicted_final_price` as "Likely final bid" in its currency ("Not available" when null),
then sample costs and profit (explicitly labeled), a max bid slider that reruns `analyzeDeal`,
then the lot's real current bid and ACV, and a "Buy now" button only when the auction offers it; condition, paperwork and pickup, where an offsite lot also shows its "Offsite address"
(`offsiteAddress`: Copart's offsite columns, filled for about 1 % of lots; the lot card has the same "Offsite" badge);
then specs as tiles and sale info as one light row, both always visible. Sale info's times
are Copart's last update of the lot ("Updated on Copart", `source_updated_at`), when the
ingest first saw it ("Added to this site", `first_seen_at`) and when it last saw it change
("Last change seen", `last_changed_at`). Copart's "Create Date/Time" (`source_created_at`)
is the moment the export was made, the same on every row and without a zone, so it is not a
lot date and is not shown. Every time on the site — the sale on both pages and those three —
is shown in the reader's own time zone, which is named ("12:00 PM EDT", "2:00 p.m. CDT" in Spanish), through
`src/components/LocalTime.tsx`: the server cannot know the zone, so an inline script rewrites
the server's text in the browser before the first paint (Next's "Preventing flash before
hydration" guide). A sale day without a time (`sale_date`) is a calendar day and stays as
the auction gives it (`saleDate`). Auction codes
are translated into plain words in one lookup table, `SIGNALS` in
`src/lib/lot-words.ts` (with the auction names, apart from the rest so the
browser's filter bar can share them), which maps each code to a key of the messages' `signals`
and sets each badge's colour; the page shows no raw
code except one the table does not know yet, which appears as it came, neutral. The
title is the exception, because Copart words and groups the same code differently by
state and the export carries only the state and the code: it reads as copart.com shows it
("OR - Lien Papers Salvage"), with the wording and the colour (Copart's clean, salvage
or non-repairable group) from `src/lib/copart-titles.json`, keyed "STATE CODE" and read
off copart.com by `scripts/copart-titles.js`. A pair the file does not hold yet shows as
the code ("OR - LS"), neutral; rerun the script to add it, and copy the file to the API
(`app/copart_titles.json`), whose title filter reads the same groups. The vehicle type is Copart's
one-letter code ("V", "K"), worded as copart.com words it ("Automobile", "Medium duty / box
truck"), from the messages' `vehicleTypes`, by `vehicleType`. Copart's title wording is not
translated: it is the document's own name. Neither the export nor copart.com has a seller type, so whether an
insurer sells the lot — an insurance claim, so less risk of swapped or missing parts or a
rolled-back odometer — is read from the seller's name (`sellerType`, the `INSURER` pattern:
add an insurer named without "insurance" there). The export names the seller for only about a
third of lots, and copart.com names it for some the export leaves blank, so an unnamed
seller is not "not an insurer": it gets no seller badge at all. Copart names a few sellers by their logo's file
("ENTERPRISE-LOGO.jpeg"), which `sellerName` shortens to the name. The
auction publishes no airbag, condition report, seller notes, pickup
deadline, storage fee or buyer eligibility, and the site has no dealer location, so
those have no place on the page yet. The ingest's own bookkeeping
(`attributes`, `row_hash`, `last_seen_at`, `removed_at`, the file ids) is not in the
API's `Lot` and so not on the page; a column the ingest adds belongs in `Lot`,
`lots-fixture.ts` and one of the page's sections. Both read
`src/lib/lots.ts` → `GET /api/lots[/{source}/{lot}]` on the API, which reads the
ingest database (`../cars-secrets-data-ingest`); the web app never opens the
database itself. Both are for signed-in dealers only: they keep their `h1` for
everyone, and a visitor gets a "Sign in" link instead of the lots. A lot the
API no longer has is a 404. `lots.ts` also holds the formatters both pages
share, so a dash for a missing value looks the same on each; `lots-fixture.ts`
is the complete lot the tests build on. The lot's photos come from
`GET /api/lots/{source}/{lot}/images` (`getLotImages`), which the API fills from
the auction; each photo carries a `thumb` and a `full` URL. The detail page shows
them as a gallery in the left column's Photos tab (`src/components/GalleryTabs.tsx`, shadcn `Tabs` with both panels kept mounted), beside the deal calculator: one full-size photo at a
time in a scroll-snapping strip, with a column of thumbnails beside it linking to
`#photo-N`. Scrolling and the jumps are the browser's own, so the page stays a
Server Component; its only JavaScript is the copy buttons (`src/components/CopyButton.tsx`),
`LocalTime`, the gallery's tab switch and the deal calculator's slider.
The photos are not tagged by the auction, so there are no Damage/Exterior/Interior filters yet. The auction may be unreachable, so no photos
is an empty list and never an error. A lot's own `image_url` is the auction's
photo *listing* endpoint, not an image: it never goes in an `<img>`.

The lot cards are horizontal, one per line (stacked, photo on top, on a phone). Each reads,
left to right: the photo (the export's `thumbnail_url` is 144px wide, so the card shows its
`_ful` twin, as the API does; https only; "No photo" without one); then the title (year, make,
model, trim, linking to the lot), "Lot N · auction · place",
mileage and primary damage, the deal-breaker badges and the sale time; then, in a column on
the right, the real figures only — current bid, likely final bid (`predicted_final_price`),
retail value (ACV) and Buy now when offered, never the calculator's samples — then Save /
Saved (`LotWatch`) and a "View details" button under them. Only the photo, the title and View details open the lot; the rest
of the card is text, to read and select. The photo and the button are out of the tab order and
hidden from screen readers, which get the title's link once rather than three times. The API
lists cars (vehicle type `V`) before every other type, whatever the order.

The premium sections (`src/components/PremiumSections.tsx`, and `DealCalculator`) carry a
grey "Premium" badge with a sparkles icon and show sample figures (see the invented-figures rule) to every
signed-in dealer, since there are no plans yet: a Summary under the badges; the gallery's
Damage map tab, the car drawn from above with each damaged area numbered and a legend in
words; the Deal calculator; then a Damage report (primary and secondary damage, the
insurer's estimate, a table of areas with severity and a used-parts estimate, and their
total) and Market (value and how the lot sells) above Condition, which they sit beside
rather than replace. Severity is words, not colour, like the rest of the grayscale page.

The lot list's search and filters (`src/components/LotFilters.tsx`, a client component around
the server-rendered cards) work like this:

- **Search** takes a make, model, year, VIN, lot number or keywords. The page asks the API what
  it names (`interpretSearch`): a lot number or VIN of exactly one lot opens that lot; a make,
  model or years ("2018-2021 toyota rav4") become those filters and removable chips; the words
  left over are keywords, matched against trim, model detail, colour, body, fuel and drive.
- **The search** is at the far left of the line above the sidebar and the lots, and **the bar**
  on its right (below `lg` the search has a line of its own). From `lg` up the bar shows the
  main filters as popovers: Sale date (Today, Tomorrow, This week, Next week, Future sale, in
  the dealer's own zone), Title (Copart's salvage, clean and non-repairable groups), Runs and
  drives and Damage, then Buy now available, a button that switches on and off in one click
  (`aria-pressed`) rather than a popover. Up to two filters the dealer has set at least three
  times move into the bar (`promoted`), never the make or model, which the search beside it
  takes. Sort, above the lots with the count and the chips: newest listed, sale
  soonest, year, mileage, retail value.
- **All filters** is a sidebar on the left, under the search and beside the lots, there from
  `lg` up and sticky, scrolling on its own. Its "Hide filters" button puts it away and the lots
  take the whole width; "Show filters · n", before the count, brings it back (both one
  `Collapsible`; open on every visit). Its groups follow how a dealer narrows a search, in
  `FILTERS`' order: **Vehicle** (vehicle type, make, model, year — From and To selects, next
  year, since model years run a year ahead, down to 1900 — mileage), **Condition** (runs and
  drives, damage, secondary damage, keys), **Price** (current bid, Buy now price, retail value), **Sale** (sale date, title — the
  document the sale hands over — sale type, Buy now available, auction, hidden while every lot
  has the same one) and **Location** (state or province, yard or offsite). The sidebar leaves
  out the bar's own filters (`PRIMARY`: sale date, title, runs and drives, damage, Buy now
  available). Each filter
  folds away (`Collapsible`): folded at first, unfolded from the start while it holds a
  choice; a switch (Buy now available) has nothing to fold. Below `lg` it is a sheet (the
  whole screen on a phone) behind the bar's "Filters · n", which holds the bar's filters too,
  each in its group,
  since the bar shows nothing else there.
- **Counts**: once the list is shown, the sidebar asks for every filter's counts in one call
  (`lotCountsAction`), which the popovers and the sheet share; each filter's counts leave out
  its own choice. An option with no lot is
  shown disabled, and a choice no lot has any more stays listed. Counts are never part of the
  page render, because counting costs a scan per filter.
- **Chips** show every chosen value with the result count; each removes its own, and
  "Clear all" keeps the order.
- **Remembered**: the filters and order (not the search's words) are kept in the dealer's
  account through the API (`rememberLotFiltersAction`), with how often each is set, so a
  visit to the bare `/active-lots` from any browser comes back as the dealer left it. A shared
  link, which has parameters, always wins.
- The dealer's time zone travels in the `cs_tz` cookie, which the bar sets from the browser,
  so "today" is their today; until it is set, it is UTC.

In place for saved lots, searches and alerts, which the API stores, finds and sends (its
`app/saved.py` and `app/alerts.py`; when an alert goes out is never decided here):

- **Save / Saved** (`src/components/LotWatch.tsx`), on every lot card, the lot page and the
  Saved page, bookmarks the auction's listing in the dealer's account and switches nothing on.
  On the lot page and the Saved page the same component offers **Remind me**: a dialog with 1
  hour before the auction (checked while no reminder is still to come) and 1 day before, each at
  its time in the dealer's zone, "Already passed" and off once its time has come, and a waiting
  state while the auction has no start time. Reminders refer to the auction's scheduled start,
  not to the lot's turn; saving them saves the lot. Under it, the reminders' status and, once
  saved, "Email me when the auction date or Buy now price changes" (change alerts).
- **Save search** (`src/components/SavedSearches.tsx`) ends the filter bar: a name drawn from the
  chips (`searchName`) and "Email me new matches", off by default. A search keeps the list's query
  without its order (`searchQuery`). While the filters on screen are a saved search's the button
  reads "Saved search", to rename it or pause its alerts. The Saved page's "Edit filters" opens the
  list with `saved=<id>`, which every URL the list makes keeps (`listPath(query, page, saved)`); the
  button then offers "Save changes" or "Save as a new search", and "Stop editing" leaves it.
- **Saved** (`/saved`): Lots and Searches tabs. Lots are lot cards with `LotWatch`; one the auction
  no longer lists reads "No longer listed" (which does not mean sold), has no links and can only be
  removed. Searches open their results, switch their alerts, edit their filters, rename, and delete
  after a confirmation, which leaves saved lots alone.
- **Alerts** (`/alerts`): the inbox, newest first, 20 to a page, by kind (`?kind=`): new matches,
  grouped by search with each lot once, naming its other searches, and "See all N"; saved-lot
  changes ("Auction: … → …", "Buy now: … → …"); and reminders. Unread ones carry a dot and a bold
  heading; following a link in one marks it read (`AlertEntry`), "Mark all as read" marks them all,
  and reading changes nothing else.
- **Settings** (`/settings`): email on or off for each kind, the search summary once a day (7 AM)
  or twice (7 AM and 5 PM), the emails' language and time zone, from the page's language and the
  browser's zone until chosen. Every alert reaches the inbox whatever is chosen here.
- The server actions (`src/app/[lang]/saved/actions.ts`, `alerts/actions.ts`,
  `settings/actions.ts`) check everything they are given, and send the page's language and the
  browser's zone along, which the API keeps for the dealer's first alert emails.

Reminders go out at their time, saved-lot changes within a minute, and search summaries at the
dealer's 7 AM (and 5 PM), by email in English or Spanish; text messages come later.

There is no "who can bid" or distance filter
(the data has neither buyer eligibility nor the dealer's location). The likely final bid uses
the real stored prediction; calculator costs and profit remain samples because the API has
no fees, transport or target profit to feed `src/lib/deal.ts` yet.

## Branching

Create a branch before starting work. The first Git action of a task is creating its branch, not committing.

`main` is the production branch — what ships. That is the whole reason task
work never lands on it directly: a commit there is a release, not a save.

Check where the working tree is first:

```bash
git branch --show-current
```

Always branch off `main`, whatever happens to be checked out. A branch cut from
another task's branch carries that task's unmerged commits into this one's diff
and its pull request.

```bash
git checkout main
git pull
git checkout -b <prefix>/<short-name>
```

Pull `main` before cutting the branch, every time — the `git pull` above is not
optional. Branching from a stale `main` puts commits somebody else already
merged into this task's diff, and turns the eventual merge into a conflict to
resolve rather than a fast-forward.

Do this before making any changes, so there is nothing to carry across.

Already on the branch for this task: stay on it rather than creating another.

Name the branch after the work, using the same prefixes as the commit messages:

- `feat/user-authentication`
- `fix/expired-access-tokens`
- `docs/api-setup-instructions`

Do not commit task work directly to `main`. This is the repository workflow that
the branch rule under "Push Rules" refers to. `main` is what a branch is cut
FROM; what it is pushed TO is always the current branch — see "Push Rules".

## Git Workflow Requirements

For every coding task in this repository, completing the implementation is **not enough**. The task is only considered complete after the changes have been committed and successfully pushed to the configured GitHub repository.

### Required workflow

After making the requested changes:

1. Run the appropriate tests, type checks, linting, formatting, or build commands for the project.
2. Review the Git diff and verify that only intended changes are included.
3. Check `git status` before committing.
4. Stage the relevant files.
5. Create a Git commit with a clear, concise commit message describing the change.
6. Push the commit to the current remote branch on GitHub.
7. Verify that the push succeeded.
8. Open a pull request for the branch, or update the one it already has.
9. Report the commit hash, the branch name and the pull request URL in the final
   response.

Do not stop after editing files, after creating a local commit, or after
pushing without a pull request.

## Versioning

Versions are automatic, in semver; never edit `version` in `package.json` or `CHANGELOG.md` by
hand. Each push to `main` that passes CI runs semantic-release (the `release` job in
`.github/workflows/ci.yml`, configured in `.releaserc.json`). It reads the commit subjects since
the last `vX.Y.Z` tag and takes the biggest bump among them:

| Commit | Bump |
|---|---|
| `type!:` or a `BREAKING CHANGE:` footer | major (also from 0.x: 0.4.2 → 1.0.0) |
| `feat:` | minor (0.1.0 → 0.2.0) |
| `fix:`, `perf:`, `refactor:`, a revert | patch (0.2.0 → 0.2.1) |
| `docs:`, `test:`, `chore:`, `ci:`, `build:`, `style:` | none: nothing is released |

It then writes the new version into `package.json` and the notes into `CHANGELOG.md`, commits
both to `main` as `chore(release): X.Y.Z [skip ci]`, tags `vX.Y.Z`
and publishes a GitHub release with the notes.
The first tag, `v0.1.0`, marks everything before automatic versioning. The `commits` job fails a
pull request holding a commit whose subject is not `type: subject` (or `type(scope): subject`),
since such a commit would silently count for nothing.

## Commit Rules

Use descriptive commit messages, prefixed with their type: the prefix decides the
next version (see Versioning).

Prefer messages such as:

- `feat: add user authentication`
- `fix: handle expired access tokens`
- `refactor: simplify payment validation`
- `test: add coverage for checkout flow`
- `docs: update API setup instructions`
- `chore: update dependencies`

Do not use vague commit messages such as:

- `changes`
- `updates`
- `fix`
- `work`
- `stuff`

Before committing, inspect the diff so accidental files are not included.

## Push Rules

After committing, push the commit to the GitHub remote.

Determine the current branch with:

```bash
git branch --show-current
```

Determine the configured remote with:

```bash
git remote -v
```

Normally push using:

```bash
git push
```

If the branch does not yet have an upstream, use:

```bash
git push -u origin <branch-name>
```

Do not assume the branch is `main`.

Do not create or switch branches unless the task requires it or the existing repository workflow clearly expects it.

## Pull Request Rules

Every push of task work is followed by a pull request. A pushed branch with no
PR is work that reaches nobody: `main` is what ships, and a pull request is the
only way a branch gets there.

Open it with the `gh` CLI, immediately after the push has succeeded:

```bash
gh pr create --base main --head "$(git branch --show-current)" \
  --title "<same prefix and subject as the commit>" \
  --body "<what changed, why, and what validation was run>"
```

- **One pull request per branch.** A push to a branch that already has an open
  PR updates that PR — check with `gh pr view` first and never open a second.
- **The base is always `main`**, never another task's branch.
- The title uses the same prefix as the commits (`feat:`, `fix:`, `docs:`, …).
- The body says what changed, why, and how it was validated.
- **Never merge the pull request.** Opening it is the end of the task; merging
  is the user's decision.
- If `gh` is not authenticated, or the remote refuses the pull request, stop and
  report the exact blocker together with the branch that was pushed — the same
  as a failed push.

Report the pull request URL in the final response.

## Safety Rules

Never use destructive Git commands unless explicitly requested.

Do **not** use:

```bash
git push --force
git push --force-with-lease
git reset --hard
git clean -fd
```

Do not rewrite published Git history.

Do not amend an existing commit unless explicitly requested.

Do not overwrite, revert, discard, or commit unrelated changes made by the user or another agent.

If unrelated uncommitted changes already exist, preserve them and commit only the files or hunks associated with the current task.

## Secrets and Sensitive Files

Before committing, make sure no secrets or sensitive information have been introduced.

Never commit files containing credentials such as:

- `.env`
- API keys
- access tokens
- private keys
- passwords
- cloud credentials
- GitHub tokens
- production secrets

If sensitive information is discovered, do not commit or push it. Remove it from the proposed changes and notify the user.

## Validation Before Commit

Before committing, run the most relevant validation available for the repository.

Examples include:

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

or the equivalent commands for the project's language and tooling.

Use the repository's existing scripts and documentation rather than inventing new validation commands.

If a validation command fails because of the changes you made, fix the problem before committing.

If validation cannot be run because of an environment limitation or an unrelated pre-existing issue, clearly mention that in the final response. This should not prevent committing and pushing otherwise valid requested changes unless doing so would create a broken repository.

## Handling Push Failures

If `git push` fails:

1. Read the Git error.
2. Diagnose whether the issue is authentication, upstream configuration, remote changes, permissions, branch protection, or another problem.
3. Resolve non-destructive issues when possible.
4. Retry the push.

Do not use force push to work around a rejected push.

If the remote branch contains new commits, fetch the latest state and integrate it safely without destroying local or remote work.

If GitHub authentication, repository permissions, branch protection, or another external restriction prevents the push, stop and clearly explain the exact blocker.

A local commit alone does **not** count as successful completion when pushing is possible.

## Documentation Requirements

Documentation is part of the change, not a follow-up. Whenever a change makes an
existing document wrong, incomplete or misleading, update it in the same commit.

Update the document that owns the subject:

| Subject | Document |
|---|---|
| rules, commands, current state | `AGENTS.md` |
| layering, the feature registry, sync collections | `docs/architecture.md` |
| auth, join codes, isolation, anything returning household data | `docs/security.md` |

Prefer correcting the existing document to adding a new one. A stale sentence is
worse than no sentence, because it is trusted — so delete what stopped being
true rather than appending the new version next to it.

A contract change is the one that reaches furthest: renaming a field or changing
a status code makes the app's documentation wrong as well as this repository's.
Say so in the pull request even when the other repository's change is not yours
to make.

Not every change needs a documentation update: a refactor with no visible
behaviour change, a test-only change or a typo fix usually does not. If nothing
needed updating, say so explicitly in the final response.

## Definition of Done

A coding task is complete only when all applicable items below are true:

- The requested implementation is finished.
- Relevant validation has been run.
- The documentation affected by the change has been updated, or the final
  response states that no document was affected.
- The Git diff has been reviewed.
- Relevant changes have been committed, documentation included.
- The commit has been successfully pushed to GitHub.
- A pull request has been opened for the branch, or the branch's existing pull
  request has been updated by the push.
- The final response identifies the pushed branch, the commit and the pull
  request URL.

At the end of the task, provide a concise summary similar to:

```text
Implemented the requested changes.

Validation:
- Tests passed
- Lint passed

Docs:
- Updated docs/security.md  (or: no documentation affected)

Git:
- Branch: feature/example
- Commit: a1b2c3d
- Pushed to: origin/feature/example
- Pull request: https://github.com/<owner>/<repo>/pull/123
```

Unless explicitly instructed otherwise, always update the affected
documentation, commit, push and open a pull request for completed coding
changes.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
