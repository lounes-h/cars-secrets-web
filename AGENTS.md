# Web app (cars-secrets-web)
A dealer-focused vehicle auction intelligence platform that aggregates active listings from Copart, IAA, Manheim, and other auction sources into one searchable interface. The platform helps dealers identify the best vehicles to buy by showing current auction data, estimated resale value, total acquisition cost, repair/transport estimates, projected profit, profit margin, and a suggested maximum bid. Users can search and filter inventory, view detailed vehicle analysis, save vehicles and searches, and receive alerts. Bidding is not handled by the platform; users are redirected to the original auction site to place bids.

## Project specification
read `docs/project-specification.md`

## Tech stack

- Next.js 16 (App Router) with React 19 and TypeScript, server-rendered and
  statically prerendered.
- Tailwind CSS 4. Design tokens are CSS variables in `src/app/globals.css`.
- No design system, logo or font choice yet: black, grey and white only, on the
  system font stack.
- Yarn 4 through Corepack (`packageManager` in `package.json`), with the
  `node-modules` linker.
- Vitest with Testing Library for unit tests.
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
yarn dev             # http://localhost:3000 (auth pages need the API: API_URL in .env.local)
yarn lint
yarn typecheck       # next typegen && tsc --noEmit
yarn test            # vitest run
yarn build && yarn start
```

Run `yarn lint && yarn typecheck && yarn test && yarn build` before committing.
GitHub Actions runs the same four checks on every pull request and on pushes
to `main` (`.github/workflows/ci.yml`).

## Architecture rules (important)

See `docs/architecture.md` for details.

- Register every public page in `src/lib/routes.ts`. The sitemap and llms.txt
  are generated from that registry, and a test fails when a `page.tsx` under
  `src/app` is missing from it. A dynamic route behind sign-in has no place in
  the registry (there is no one path to register): it builds its metadata with
  `buildMetadata({ noindex: true })` in `generateMetadata` instead, as
  `/active-lots/[source]/[lotNumber]` does.
- Build page metadata with `metadataForRoute()` or `buildMetadata()` from
  `src/lib/seo/metadata.ts`. Never hand-write `title`, canonical or Open Graph
  metadata.
- There is no structured data: schema.org needs a brand name, and there is
  none yet. Add the builders back with the brand.
- Each page has one `h1`. Its lede answers the page's question directly, so
  search engines and AI assistants can quote it. The auth pages are the
  exception: heading and form only, no lede — their registered description
  carries the answer.
- The layout is full width: no centered `max-w-*` page container. Sections
  span the viewport with side padding (`px-4 sm:px-6 lg:px-10`), and only
  running text is capped at a readable measure (`max-w-[65ch]`). Auth pages
  are the exception: their form sits in one centered `.auth-panel` column
  (28rem) inside `.auth-main`, which fills the viewport with white, because a
  full-width form is hard to fill in.
- There is no design system, logo, favicon or share image yet, and no dark
  mode. The interface uses black, grey and white only: `--ink`, `--muted`,
  `--line`, `--paper` and `--surface` in `src/app/globals.css`. `--ink` carries
  buttons, links, checkboxes and focus rings; errors read as bold text rather
  than a colour, since there is no error colour. The one exception is the lot
  page's deal-breaker badges and sale countdown: `--good`, `--warn` and `--bad`
  (with `-bg` variants) colour them green, amber and red, and every badge also
  carries an icon and words, never colour alone. Basic styling lives on those
  tokens: base styles for headings, labels, inputs, selects, checkboxes, links
  and alerts, plus a few classes (`btn`, `btn-primary`, `btn-outline`,
  `btn-ghost`, `btn-link`, `card`, `auth-main`, `auth-panel`, `form-stack`,
  `phone-field`, `divider`, `hint`, `notice`, `badge`). Reuse them rather than adding
  one-off styles, and add no branding until the name and a design exist.
- The top banner (`src/components/SiteBanner.tsx`) is rendered by the root
  layout on every page and shows the site name as plain text. Its navigation
  (`src/components/AccountNav.tsx`) is a client component that asks
  `/auth/session` after each navigation and renders both the main menu and the
  account side: Active lots, VIN Lookup, Best Buys, then How It Works and Pricing
  with "Sign in" and the "7 days free trial" button for visitors, or Saved and
  Alerts with the dealer's avatar and "Sign out" once signed in. The menu is
  hidden below `lg`. Never read the session in the root layout: it would make
  every page dynamic.
- Pages are Server Components and stay static. Add `"use client"` only where
  interaction needs it. Pages that read the session (`/register`, `/login`,
  `/account`) or a token from the URL are dynamic by necessity.
- Auth lives in the `src/app/(auth)` route group: `actions.ts` holds every auth
  server action, the pages sit next to it, and `/account` sits outside it.
  Forms use React Hook Form with Zod (`src/lib/auth-schemas.ts`): the same
  schema validates in the browser and again in the server action, and the form
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
  form shows and the validation the schema applies, so add a rule there and
  nowhere else; the API applies the same rules. The checklist appears on the
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
- Never publish invented statistics, testimonials, reviews or prices.

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
`NEXT_PUBLIC_SITE_URL=https://cars-secrets.test` so that URLs are deterministic.

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
`/reset-password`, `/verify-email`, `/account`), `/active-lots` (the lot listing)
and the empty placeholders the banner menu links to: `/vin-lookup`,
`/best-buys`, `/how-it-works`, `/pricing`, `/saved` and `/alerts` — blank white
pages with metadata only, so they have no `h1` until there is something to put
on them.
Styling stays basic until a design system exists. `/` is the home page: the
centred title "Everything You Need to Know Before Buying a Car at Auction" and
nothing else yet. Add no other pages until the user asks.

**There is no brand name.** `src/lib/site.ts` holds only the URL, language,
locale and a description; nothing invents a name, a slogan or a wordmark.
Page titles stand alone (no "| Name" suffix), the banner links home with the
word "Home", and `llms.txt` is headed by the site host (`siteHost`). The
repository and the API keep their `cars-secrets-*` names, and so does the
`cars-secrets.test` origin the tests run against. Until a name is chosen, the
work is features and functionality, not branding — do not add one.

In place: the Next.js, Yarn 4, Tailwind and Vitest setup; the root layout
(grayscale tokens and the full-width top banner); the SEO builders (metadata,
sitemap, robots, llms.txt); `robots.txt` with AI crawlers allowed; security
headers; and the deal calculation in `src/lib/deal.ts`. There is no logo,
favicon, touch icon, web app manifest, share image or structured data.

In place for accounts: registration (names, email, optional phone with every
country's flag and calling code, password with show/hide, Turnstile captcha),
email confirmation by a six-digit emailed code that also signs the dealer in (one numeric
field that takes pastes and one-time-code autofill, a new code after 60 seconds), sign-in with remember me (captcha after
repeated failures), sign-out, forgot and reset password, and Google and Apple
buttons. The API answers "not configured" for Google and Apple until their
credentials are set. There is no terms checkbox: the button reads "Agree and
register" and a sentence above it says that clicking it is the agreement, so the
action always tells the API the terms are accepted. The Terms of Use and Privacy
Policy themselves do not exist yet.

In place for lots: `/active-lots` ("Active lots" in the menu and as its `h1`; the
path was `/auctions`, which redirects here permanently) lists active lots, the most recently listed
first (the API's order), 20 to a page (`?page=`), and `/active-lots/[source]/[lotNumber]` shows one lot —
every column the ingest keeps for it, every photo of it, and a "Place bid" button
(plus "Buy now" when the auction offers it) to the auction site, since bidding never
happens here. The page reads top to bottom as: a summary (title, lot number and VIN
with copy buttons, the time left before the sale, a meta line, one plain sentence and
the deal-breaker badges in a fixed order: run status, keys, title, then odometer and
sale status only when they are not the normal case); the photos beside the all-in cost
card, the one emphasised card, whose fee and shipping rows read "Not estimated yet" and
whose total stays a dash until those estimates exist; condition, paperwork and pickup;
then specs as tiles and sale info as one light row, both always visible. Auction codes
are translated into plain words in one lookup table, `SIGNALS` in
`src/lib/lot-signals.ts`, which also sets each badge's colour; the page shows no raw
code except one the table does not know yet, which appears as it came, neutral. The
auction publishes no airbag, seller type, condition report, seller notes, pickup
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
them as a gallery in the left column beside the cost card: one full-size photo at a
time in a scroll-snapping strip, with a column of thumbnails beside it linking to
`#photo-N`. Scrolling and the jumps are the browser's own, so the page stays a
Server Component; its only JavaScript is the copy buttons (`src/components/CopyButton.tsx`).
The photos are not tagged by the auction, so there are no Damage/Exterior/Interior filters yet. The auction may be unreachable, so no photos
is an empty list and never an error. A lot's own `image_url` is the auction's
photo *listing* endpoint, not an image: it never goes in an `<img>`.

There is no search or filtering yet, no deal figures on the pages
(`src/lib/deal.ts` has no inputs for fees, transport or a target profit yet, and
nothing may be invented), and no saved lots or alerts.

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

## Commit Rules

Use descriptive commit messages.

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
