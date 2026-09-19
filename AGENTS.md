# Cars Secrets Web
A dealer-focused vehicle auction intelligence platform that aggregates active listings from Copart, IAA, Manheim, and other auction sources into one searchable interface. The platform helps dealers identify the best vehicles to buy by showing current auction data, estimated resale value, total acquisition cost, repair/transport estimates, projected profit, profit margin, and a suggested maximum bid. Users can search and filter inventory, view detailed vehicle analysis, save vehicles and searches, and receive alerts. Bidding is not handled by the platform; users are redirected to the original auction site to place bids.

## Tech stack

- Next.js 16 (App Router) with React 19 and TypeScript, server-rendered and
  statically prerendered.
- Tailwind CSS 4. Design tokens are CSS variables in `src/app/globals.css`.
- Font: Libre Franklin via `next/font/google`.
- Yarn 4 through Corepack (`packageManager` in `package.json`), with the
  `node-modules` linker.
- Vitest with Testing Library for unit tests.
- Hosted on Render (`render.yaml`), which deploys `main`.

Next 16 differs from older versions. Before using an API, read the bundled docs
in `node_modules/next/dist/docs/`.

## Commands

```bash
corepack enable      # once per machine
yarn install
yarn dev             # http://localhost:3000
yarn lint
yarn typecheck       # next typegen && tsc --noEmit
yarn test            # vitest run
yarn build && yarn start
```

Run `yarn lint && yarn typecheck && yarn test && yarn build` before committing.

## Architecture rules (important)

See `docs/architecture.md` for details.

- Register every public page in `src/lib/routes.ts`. The sitemap and llms.txt
  are generated from that registry, and a test fails when a `page.tsx` under
  `src/app` is missing from it.
- Build page metadata with `metadataForRoute()` or `buildMetadata()` from
  `src/lib/seo/metadata.ts`. Never hand-write `title`, canonical or Open Graph
  metadata.
- Structured data comes from the builders in `src/lib/seo/jsonld.ts`,
  rendered with `<JsonLd>`.
- Each page has one `h1`. Its lede answers the page's question directly, so
  search engines and AI assistants can quote it.
- The layout is full width: no centered `max-w-*` page container. Sections
  span the viewport with side padding (`px-4 sm:px-6 lg:px-10`), and only
  running text is capped at a readable measure (`max-w-[65ch]`).
- The top banner (`src/components/SiteBanner.tsx`) is rendered by the root
  layout on every page. Brand logos live in `public/brand/`: `logo-light.png`
  and `logo-dark.png`, 879×120 16-colour palette PNGs of about 7 KB each. They
  are served as-is because the Next image optimizer makes them larger.
- Pages are Server Components and stay static. Add `"use client"` only where
  interaction needs it.
- Deal arithmetic (cost, profit, margin, max bid) lives only in
  `src/lib/deal.ts`.
- Never publish invented statistics, testimonials, reviews or prices.

## Security rules

See `docs/security.md`. Security headers are set in `next.config.ts`. The only
public environment variable is `NEXT_PUBLIC_SITE_URL`, and secrets never use the
`NEXT_PUBLIC_` prefix.

## Migrations

There is no database yet.

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

This is the foundation only. **No pages have been built yet**, and none should be
added until the user asks. The route registry is empty and `/` returns 404.

In place: the Next.js, Yarn 4, Tailwind and Vitest setup; the root layout
(Libre Franklin, design tokens, Organization and WebSite JSON-LD, and the
full-width top banner with the brand logo); the SEO
builders (metadata, JSON-LD, sitemap, robots, llms.txt); `robots.txt` with AI
crawlers allowed; the Open Graph image, manifest, icon and `logo.png`; security
headers; and the deal calculation in `src/lib/deal.ts`.

There is no auth, database, auction data feed, search, saved vehicles or alerts
yet.

## Branching

Create a branch before starting work. The first Git action of a task is creating its branch, not committing.

`main` is the production branch — what ships. That is the whole reason task
work never lands on it directly: a commit there is a release, not a save.
Render deploys `main`, so a push to it goes live.

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
