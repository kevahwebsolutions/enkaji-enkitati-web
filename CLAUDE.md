# Enkaji Enkitati CBO website

Public website and admin CMS for Enkaji Enkitati CBO, a women-led community-based organization in Ewaso Ng'iro, Narok County, Kenya. Tagline: "Empowering Women, Sustaining Futures". The site serves donors, sponsors, community members, schools and volunteers: marketing pages, five program pages, events, news, gallery, partner/donate page, contact and volunteer forms, and a Payload admin so officials can publish without a developer. English only. Source of truth: `docs/SRS.md`. Public-safe source copy and brand files: `enkaji-content/`.

## Stack (SRS 8.2)

- Next.js App Router with React Server Components, TypeScript strict
- Payload CMS 3 with `@payloadcms/db-postgres` and Lexical rich text; PostgreSQL 16
- Tailwind CSS, shadcn/ui on Radix primitives, `class-variance-authority`
- Motion (`motion` package), wrapped in a `useReducedMotion` guard
- Lucide React icons
- React Hook Form + Zod, Next.js Server Actions
- Email: Nodemailer over SMTP or Resend. Spam: Cloudflare Turnstile
- Media: Payload uploads with Sharp (local disk, or R2 via `@payloadcms/storage-s3`)
- Phase 2 only: Safaricom Daraja M-PESA Express (STK Push)
- Analytics: Plausible or Umami (cookieless). Monitoring: Sentry, UptimeRobot
- Tests: Vitest (units), Playwright (E2E smoke)
- Hosting: Ubuntu VPS, Node 22+, PM2, Nginx, Cloudflare. CI: GitHub Actions

## Folder structure (SRS 8.4)

```text
src/
  app/
    (frontend)/          public routes, layout, globals.css
    (payload)/admin/     Payload admin
    api/                 mpesa callback, revalidate, rss
  access/                role helpers and access functions (the access matrix lives here)
  blocks/                page and rich-text blocks
  collections/           Payload collection configs
  fields/                shared fields (SEO, placeholder, versions config)
  globals/
  hooks/                 audit, consent, drafts, placeholder, revalidate hooks
  migrations/            Payload SQL migrations (committed)
  components/
    ui/                  shadcn components
    motion/              Reveal, Stagger, HoverLift
    sections/            Hero, ProgramGrid, EventList ...
  lib/                   payload client, mpesa, mail, phone, seo
  seed/                  programs, events, pages seed data
  payload.config.ts
public/
tests/
.env.example
```

`payload.config.ts` lives in `src/` (the create-payload-app layout with a `src/` directory); the `@payload-config` alias points to it.

## Privacy rules (SRS 7.3) - non-negotiable

- Never store or render registration or certificate numbers, national ID numbers, KRA PINs, signatures, or members' personal phone numbers. Not in code, seed data, the CMS, fixtures, tests or rendered HTML.
- The only public phone number is +254 721 500197 (WhatsApp 254721500197). Public email: info@enkajienkitaticbo.org.
- Children are never named alongside a photo. Photos of minors need recorded guardian consent. Stories on FGM, GBV or early marriage use pseudonyms and no identifying images.
- Images and Team entries carry a "consent on file" flag; unchecked items cannot be published.
- Never present plans as results ("We aim to reach 200 girls", not "We have reached"). Seed records carry `isPlaceholder: true`.
- Source documents with sensitive data stay outside this repo.

## Brand tokens (enkaji-content/brand/brand.md)

| Token                    | Hex       | Use                                                      |
| ------------------------ | --------- | -------------------------------------------------------- |
| `--primary` forest green | `#1C380E` | header, headings, primary buttons, footer background     |
| `--primary-soft`         | `#2E5A1C` | hover, links                                             |
| `--accent` harvest gold  | `#C4A050` | Donate button fill, icons, dividers. Never text on white |
| `--accent-ink` deep gold | `#7A5C22` | gold text on light backgrounds                           |
| `--bead` cream           | `#EEE3C4` | pattern fills, card tints                                |
| `--sand`                 | `#F7F1E1` | section backgrounds                                      |
| `--ink`                  | `#1C1A17` | body text                                                |

- Donate button: gold fill with green text. Light theme only.
- Type: headings Libre Baskerville (or Cormorant Garamond 600), mixed case; eyebrow labels in spaced capitals in the same serif; body Inter. Load via `next/font` with `display: swap`, two families maximum.
- Imagery: no stock photos of people. Use illustrated or bead-pattern placeholders until real photos exist.
- WCAG 2.1 AA: 4.5:1 text contrast, visible focus, keyboard navigation, skip link, 44 px touch targets, one `h1` per page.

## Motion rules (SRS 9.5)

- Section entrance: fade + 16 px rise via `whileInView`, once, 0.5 s ease-out, viewport amount 0.2.
- Lists and card grids: stagger children by 0.06 s.
- Cards and buttons: hover lift 2-4 px with a shadow change; tap scale 0.98.
- Hero: headline word-stagger; the logo's gold path draws in once (SVG stroke); bead-diamond band as a subtle divider.
- Counters: count-up on view, only for real, verified numbers.
- Reduced motion: everything becomes an instant opacity change or nothing. No content may depend on motion.

## CMS rules (Payload)

- **Roles** (SRS 4.1): `super-admin`, `editor`, `contributor`, `viewer`. Enforce access in `src/access` on every collection and global, never only in the UI. The local API bypasses access unless `overrideAccess: false` is passed with a `user`; frontend reads must request `draft: false`.
- **Schema changes** go through migrations: `npm run migrate:create -- <name>`, review the SQL, then `npm run migrate`. The adapter has `push: false`. After changing fields run `npm run generate:types` and `npm run generate:importmap`; `src/payload-types.ts` is committed.
- **Publishing**: only editors and super-admins publish. Contributors are forced to save drafts by `forceDraftUnlessPublisher`.
- **Consent**: `requireConsentOnPublish` blocks publishing content that references media or team entries without `consentOnFile`. Public reads of media and team also filter on `consentOnFile`.
- **Payment and bank fields** live in the `site-settings` global and are readable and editable by super-admins only. The frontend gets them only through `getPaymentDetails()` in `src/lib/site-settings.ts`, which is `server-only`. Never import it from a client component.
- **Placeholders**: seed records set `isPlaceholder: true`. The flag clears itself when a signed-in user changes real content on the record.
- **Fields beyond SRS 8.3**: `isPlaceholder`, `createdBy` (contributor ownership), the `meta` SEO group (FR-CMS-09), and `events.summary` (the seed events carry one).
- **Cache tags** (`src/lib/cache-tags.ts`): `collection:<slug>` for lists and queries (`collection:events`), `doc:<slug>:<key>` for one document keyed by slug or id (`doc:events:rural-women-day-2026`), `global:<slug>` for globals (`global:site-settings`). Fetchers wrap Payload reads in `unstable_cache` with these tags. The afterChange and afterDelete hooks in `src/hooks/revalidate.ts` purge the tags and the affected routes, and only when a document is published, unpublished or deleted. Add new public collections to `collectionPaths` there.

## Page structure

- The root layout in `src/app/(frontend)/layout.tsx` renders the skip link, header, `<main id="main">`, footer and analytics. Pages must not render their own `<main>`, header or footer.
- Every page has exactly one `h1`. Inner pages get it from `PageHero` (`src/components/layout`); do not add a second `H1`. The shell e2e test checks the count.
- Use `Container` for page width, `Section` for vertical bands (optional sand tone and bead divider; give it `aria-labelledby`), and `PageHero` with a breadcrumb for inner pages.
- Navigation lives in `src/components/layout/nav.ts`; program links come from the CMS through `getNavPrograms()`. Social icons render only for URLs set in site settings. Lucide has no brand icons, so `BrandIcon` draws them.
- Analytics load only when `NEXT_PUBLIC_ANALYTICS_SRC` is set (Plausible: also `NEXT_PUBLIC_ANALYTICS_DOMAIN`; Umami: also `NEXT_PUBLIC_ANALYTICS_WEBSITE_ID`).

## Home page and performance

- Home data comes from `src/lib/home-data.ts` (cached with the tags in `cache-tags.ts`, plus an hourly window so "upcoming" moves on). Copy defaults live in `src/lib/home-defaults.ts` and also seed the Home global.
- Keep the hero headline and lead as plain visible text with no entrance animation: they must be the LCP element. Never put a raster image (including an SVG `<image>`) in the first viewport; the hero mark is traced vector paths generated by `npm run brand:assets` into `hero-mark.generated.ts`.
- Page sections are server components. The only client components are the motion wrappers (`src/components/motion`), the header (scroll shrink and dropdowns) and the lazily loaded mobile menu sheet. Motion features load as an async chunk (`load-features.ts`).
- The Narok map is generated from public-domain boundaries by `scripts/narok-map.ts`. Do not add map libraries.
- Lighthouse on this Windows machine varies by 20 points between identical runs; judge performance on repeated runs or on the server, and compare observed LCP as well as the simulated score.

## Content pages

- The local API bypasses collection access, so public fetchers must filter themselves: published only (`_status`), and `consentOnFile: true` for team (see `src/lib/about-data.ts`). Never read team or media for a public page without that filter.
- CMS pages (`founder`, `governance`, later `privacy`, `terms`, `safeguarding`) come from the `pages` collection through `getPage(slug)`. `pageParts()` splits one into hero, rich-text blocks and extra blocks; `ExtraBlocks` renders any call-to-action, cards or FAQ blocks so nothing an editor adds is dropped. Rich text renders through `src/components/ui/RichText.tsx` (internal links use `next/link`, YouTube embeds use youtube-nocookie).
- `redactPersonalNumbers()` strips number-like text from team bios before display. `npm run check:privacy` scans the built output and the source for personal phone numbers, ID numbers and KRA PINs; run it after every build. Only +254 721 500197 is allowed.
- The Leadership page shows an explanatory message until at least one team member has consent on file; tick it in the admin when each person agrees.

## Programs and impact

- Program pages are generated from the CMS (`generateStaticParams`), and any slug not in the CMS returns 404. Related events, posts and album photos are matched by the program relation and read through `src/lib/programs-data.ts`; the revalidate hook purges every `/programs/[slug]` page when an event, post or album changes.
- Cache tags are expired immediately on publish (`revalidateTag(tag, { expire: 0 })`), so the first visitor after a publish sees the new content.
- Mentorship topic lists come from the program body: headings containing "Primary school" and "High school" with a list under each become the Tabs on Education and Mentorship.
- The Impact page presents targets and budgets only as plans. Keep the labels ("2026-2030 targets", "Planned annual budget (KES)", "not money received or spent") and never add wording that claims results; `tests/e2e/programs.e2e.spec.ts` guards this. Add real results only with evidence.

## Events and RSVP

- Upcoming or past is never stored: it is worked out from `endsAt` (Nairobi time) every time `/events` renders (`isOver` in `src/lib/event-time.ts`; get the clock through `currentTime()`). The `status` field means "cancelled" only. `/events` is dynamic and its state (tab, view, program, month, page) lives in the URL as plain links, so it needs no client JavaScript. Detail pages refresh every minute and on publish.
- RSVPs are stored as `form-submissions` of type `rsvp`. Capacity is enforced in `src/lib/rsvp.ts`: the count and the insert run in one transaction behind a per-event Postgres advisory lock, so simultaneous registrations cannot oversubscribe (`tests/int/rsvp.int.spec.ts` proves it). Closed (past, cancelled, RSVP off), full and rate-limited cases are all re-checked in the server action, never trusted from the page.
- Keep the RSVP form mounted when the last place is taken, or the confirmation is lost to the page refresh.
- Calendar files come from `src/lib/ics.ts` (UTC times, folded lines) through `/events/[slug]/calendar.ics`; `tests/unit/events.spec.ts` parses the output with a real iCalendar parser. Default sponsor tiers live in `src/lib/sponsor-tiers.ts` and a test keeps them equal to `enkaji-content/content/partner.md`.
- `src/lib/phone.ts` normalises Kenyan mobile numbers to 2547XXXXXXXX; reuse it in every form.

## News and gallery

- `/news` is dynamic and keeps category, search and page in the URL (`newsUrl()` in `src/lib/news-url.ts`), so they combine and work without JavaScript; `NewsSearch` only adds the debounced as-you-type behaviour. Changing the category or the search resets to page 1.
- Search is Postgres full-text search in `searchPostIds` (`src/lib/news-data.ts`): title weight A, excerpt B, the text inside the rich-text body C, prefix matching while typing. Input is reduced to letters and digits before it reaches `to_tsquery`, and drafts never match. Search results are not cached and are `noindex`; categories and pages are indexed with their own canonicals.
- Reading time is words divided by 200 (`readingMinutes`). A post shows its author only when the team entry has consent on file.
- Share buttons are plain links (`src/lib/share.ts`) plus a copy-link button; the news page must load no third-party script (a test checks every request). The RSS feed is `src/lib/rss.ts` through `/news/rss.xml`; keep it RSS 2.0 with an Atom self link and RFC 822 dates (it passes the W3C Feed Validator).
- Gallery lightbox (`src/components/gallery/PhotoGrid.tsx`) is a Radix Dialog: focus is trapped, arrow keys, Home and End move between photos, Escape closes and returns focus to the thumbnail of the photo on screen, and a horizontal swipe changes photo. Keep thumbnails lazy-loaded with width and height set.
- The seed adds two placeholder albums made from the illustrated covers; replace them with real, consented photos.

## Forms (FR-FRM, FR-NL-01)

- One zod schema per form in `src/lib/forms/schemas.ts`, used by the React Hook Form client (`components/forms/AppForm.tsx`, field lists in `definitions.ts`) and again by the server action (`app/actions/forms.ts` -> `processSubmission` in `lib/forms/submit.ts`). Never trust client validation.
- Pipeline order: honeypot (`website`, quiet fake success) -> validate (field errors returned inline) -> Turnstile -> rate limit (5 per IP per 10 min, counted from `form_submissions.ip_hash`, a salted HMAC; the raw IP is never stored) -> save -> notify `CONTACT_INBOX` (reply-to is the sender) -> branded HTML+text acknowledgement -> update `emailStatus`. Email is best effort after the save: a mail failure marks `emailStatus` failed/skipped and never loses the submission. A pledge also creates a `donations` record (status pledged).
- Turnstile (`lib/forms/turnstile.ts`) is checked server-side with `TURNSTILE_SECRET_KEY`. Production fails closed when the secret is missing; development skips the check. `TURNSTILE_VERIFY_URL` overrides the endpoint (tests only). Local `.env` holds Cloudflare's always-pass test keys.
- Phones are normalised by `lib/phone.ts` to 2547XXXXXXXX or 2541XXXXXXXX before saving.
- Mail: Nodemailer from `SMTP_*`, sender `MAIL_FROM`. Local inbox is Mailpit (`npm run mail:dev`, UI http://localhost:8025). Templates in `lib/forms/templates.ts` use brand hex colours and the cream logo by cid.
- Newsletter double opt-in (`lib/forms/newsletter.ts`): signed tokens `id.expiry.sig`, scoped by purpose and by the subscriber's stored random token (a new signup replaces it and kills old links). Confirm links last 7 days; unsubscribe links never expire. Routes: `/newsletter/confirm` (GET, redirects to `/newsletter/status`), `/newsletter/unsubscribe` (page + POST action), `/newsletter/unsubscribe/one-click` (POST only, for mail clients). The footer signup is a plain GET form to `/newsletter` so consent and Turnstile happen there.
- Retention (NFR-PRV-05): Payload task `purgeOldSubmissions` (nightly 03:00) deletes form submissions older than 24 months and unconfirmed subscribers older than 30 days. `donations` are never purged.
- Admin CSV export: `GET /api/form-submissions/export.csv` (button above the list), role-gated, formula-injection safe, written to the audit log. IP hashes are not exported.
- Host pages: `/contact`, `/get-involved`, `/partner`, `/donate` are built out (see Get involved, partner, donate and contact below); `/newsletter` is a plain form host. `/privacy`, `/terms`, `/safeguarding` render the seeded CMS pages through `components/layout/LegalPage.tsx`.
- RSVP (events) has its own flow and does not yet use Turnstile or email.
- Tests: `tests/unit/phone.spec.ts`, `tests/unit/forms.spec.ts`, `tests/int/forms.int.spec.ts` (needs Mailpit), `tests/e2e/forms.e2e.spec.ts` (skips if Mailpit is down).

## Get involved, partner, donate and contact

- `/donate` reads site settings through the server-only `getPaymentDetails()`, which returns null unless `donateEnabled` is on AND a Paybill/Till or a usable bank account (`hasMpesa`, `hasBank`) is filled in. Null means "Online giving is coming soon" with the pledge form and contact details. Nothing about payment is hard-coded; publishing site settings purges the cache, so changes show at once. Copy buttons use `components/donate/CopyButton.tsx` (clipboard plus an aria-live toast). `?program=` preselects the pledge form's program.
- `/partner` takes the planned budget from the Impact global (`annualPlan`, shown with the "plan, not money received" wording), the profile download from `documents` of type `profile` (hidden when none), and the tiers from `sponsor-tiers.ts`.
- `/get-involved` volunteer roles live in `src/lib/volunteer-roles.ts`.
- `/contact` map (`components/contact/MapEmbed.tsx`) makes no OpenStreetMap request until "Show map" is pressed; a test checks this. `SocialIcons` takes `tone="light"` on pale backgrounds.
- Tests: `tests/e2e/involve.e2e.spec.ts` (sets and clears payment details through the API, then restores the empty state).

## Language

English only. No translation layer, no i18n routing.

## Working rules

- TypeScript strict. No `any` without a justified comment.
- No placeholder or TODO code. Finish what you write, or do not write it.
- No emojis in code or UI. Icons are Lucide only.
- Server components by default; add `'use client'` only for interactivity, state or motion.
- Secrets only in environment variables. `.env*` is git-ignored except `.env.example`, which holds names only.
- Before saying a task is done, run `npm run typecheck`, `npm run lint` and `npm run build`, and report any failure with its output.

## Commands

`npm run dev`, `build`, `start`, `typecheck`, `lint`, `format`, `seed`, `test` (Vitest), `test:e2e` (Playwright).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
