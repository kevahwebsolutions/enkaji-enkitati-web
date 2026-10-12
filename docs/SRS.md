# ENKAJI ENKITATI CBO — Website Software Requirements Specification

Oct 11, 2026 · @Kelvin Njoroge

## 1. Introduction

This SRS defines a public website for ENKAJI ENKITATI Community Based Organization (CBO) of Ewaso Ng'iro, Narok County, built from the 26 files in the organization's document pack. It is the single source of truth for the Claude Code build prompts that follow.

### 1.1 Purpose

- Give the CBO a credible online presence for donors, partners, county government and the community.
- Turn the existing draft material (constitution, objectives, proposals, programs, calendar) into structured, editable web content.
- Provide a simple admin so officials can publish news, events and gallery items without a developer.

### 1.2 Scope

**In scope (Phase 1):** marketing site, program pages, events calendar, news, gallery, partner/donate page, contact and volunteer forms, admin CMS, SEO, analytics.

**Phase 2:** online giving via M-PESA STK Push (needs the CBO's own Paybill/Till), newsletter automation. The site is English only; no translation layer is built.

**Out of scope:** member portal, VSLA savings/loan management system, payroll, donor CRM. The VSLA register and passbooks stay offline.

### 1.3 Audience of this document

| Reader | Uses it for |
| --- | --- |
| Kelvin (IT lead / implementer) | Architecture, build prompts, acceptance |
| CBO executive committee | Content sign-off, open questions in section 10 |
| Claude Code | Requirements context for each build prompt |

### 1.4 Definitions

| Term | Meaning |
| --- | --- |
| CBO | Community Based Organization, registered with the county Department of Social Development |
| VSLA | Village Savings and Loan Association (table banking) |
| MHM | Menstrual Health and Hygiene |
| GBV / FGM | Gender-Based Violence / Female Genital Mutilation |
| SDG | UN Sustainable Development Goal |
| CMS | Content Management System (admin panel) |
| KDPA | Kenya Data Protection Act, 2019 |
| STK Push | Safaricom M-PESA payment prompt sent to a phone |

### 1.5 References

All source files are listed and classified in section 3. The authoritative documents for legal identity are the Constitution and formation minutes (`REG/REQ FOR REG/MINUTES OF THE CBO AND CONSTITUTION.docx`).

## 2. Organization overview

ENKAJI ENKITATI CBO is a women-led grassroots organization in rural Maasai communities of Narok County. It works on women's economic empowerment, girls' education and dignity, and support for vulnerable households. The facts below come from the source files. Where files contradict each other, the conflict is flagged here and in section 10.

### 2.1 Identity

| Field | Value | Source |
| --- | --- | --- |
| Official name | Enkaji Enkitati CBO (written ENKAJI ENKITATI CBO in the logo wordmark) | Kelvin, 11 Oct 2026 |
| Tagline | Empowering Women, Sustaining Futures | Logo |
| Location | Narok, Kenya (area of operation: Ewaso Ng'iro, Narok Town Ward, Narok North Constituency, Narok County) | Constitution, Art. 2 |
| Public email | info@enkajienkitaticbo.org | Kelvin |
| Public phone | +254 721 500197 | Kelvin |
| Domain | enkajienkitaticbo.org | From the email address |
| Founder and Chairperson | Caren Naeku Dapash | Kelvin; My Story |

Registration certificates, name-search records, national ID numbers and similar identifiers are **never** shown on the site or stored in the CMS.

### 2.2 Vision and mission

These are drafts from the brochure. The constitution itself has no vision or mission article. The logo tagline, "Empowering Women, Sustaining Futures", is the primary line on the site.

- **Vision:** A society where women and girls live with dignity, equality, and opportunity.
- **Mission:** To empower women and girls through education, health, economic empowerment, and advocacy for gender equality and sustainable community development.
- **Core values (draft):** Integrity, Accountability, Inclusivity, Compassion, Empowerment, Service.

### 2.3 Constitutional objectives

1. Empower women economically and socially.
2. Promote sustainable livelihoods.
3. Support vulnerable families in the community.
4. Enhance education and skills development.
5. Mobilize resources for community development projects.
6. Promote unity and cooperation among members.

### 2.4 Program areas for the website

These merge the five operational objectives (Detailed Objectives doc, Donor Proposal) with the advocacy themes (Brochure, SDG doc).

| Program | What it covers | Department / initiative | Primary SDGs |
| --- | --- | --- | --- |
| Women Economic Empowerment | VSLA / table banking, business skills, beadwork and handicraft, poultry and dairy goats, market linkage | Economic Empowerment Dept. | 1, 5, 8 |
| Girls' Dignity and Health | Menstrual hygiene education, sanitary towel drives, dignity packs, anti-FGM and GBV awareness | Advocacy activities | 3, 5, 6 |
| Education and Mentorship | Primary and high school mentorship (10 topics each), career guidance, book drives, adult literacy | Ignite Dreams Initiative | 4 |
| Community Development | Tree nursery, clean-ups, water harvesting, youth sports | Community Development Dept. | 6, 13 |
| Vulnerable Households | Food baskets, school fee support, emergency fund, elderly and disability support | Social Welfare Dept. | 1, 10 |

### 2.5 Governance

The constitution sets five elected officials, monthly meetings, a 50% quorum, majority decisions and a two-signature bank rule. The executive committee below was confirmed on 11 Oct 2026 and replaces the conflicting versions in the source files.

| Office | Name |
| --- | --- |
| Chairperson | Caren Naeku Dapash |
| Vice Chairperson | Pauline Dapash |
| Secretary | Nairuko Karkar |
| Assistant Secretary | Jeniffer Kalepe |
| Treasurer | Mariam Chacha |

The Leadership page shows name, role, photo and a short bio only. Personal phone numbers stay off the site.

### 2.6 Membership

The documents show 15 founding members (5 officials, 10 general members). The VSLA register lists one more, Hellen Ng'etich, for 16. Only names and roles approved by each member may appear on the site.

### 2.7 Annual calendar (advocacy days)

The events module is seeded from the calendar file: 24 Jan Education Day, 6 Feb Zero Tolerance for FGM, 8 Mar Women's Day, 7 Apr World Health Day, 25 May Africa Day, 28 May Menstrual Hygiene Day, 5 Jun Environment Day, 16 Jun Day of the African Child, 12 Aug Youth Day, 21 Sep Peace Day, 11 Oct Day of the Girl Child, 15 Oct Rural Women's Day, 25 Nov–10 Dec 16 Days of Activism, 1 Dec World AIDS Day, 5 Dec Volunteer Day.

## 3. Content inventory

The pack has 26 files: 20 Word documents, 2 Excel workbooks, 2 PDFs and 2 JPEGs. One PDF duplicates the founder's story .docx. There are **no logo files and no programme photos**. Several documents are pasted AI chat replies ("Hello! That's a good choice") and use other names: "Enkitati Women CBO", "The Nasieku Foundation", "Ignite Dreams Initiative". All website copy must be rewritten under the legal name.

**Use** = source for public copy. **Reference** = shapes structure, not published as-is. **Exclude** = never published.

| File | Contents | Website use | Decision |
| --- | --- | --- | --- |
| REG/REQ FOR REG/MINUTES OF THE CBO AND CONSTITUTION.docx | Formation minutes (unfilled date/venue), officials, full constitution | About, Governance | Use |
| CBO MANAGEMENT/DETAILED OBJECTIVES OF ENKAJI ENKITATI CBO.docx | 5 objectives with departments, activities, projects | Programs pages | Use |
| CBO MANAGEMENT/ENKAJI E NKITATI CBO BRONCHURE.docx | 6-page brochure: mission, vision, programmes, SDGs, brand colours | Home, About, Partner | Use (rename) |
| CBO MANAGEMENT/DONORS & SDGs.docx | SDG alignment table and narrative; grant ranges | Impact / SDG section | Use (rename) |
| CBO MANAGEMENT/LOGICAL FRAMEWORK FOR CBO.docx | Logframe, 10-page proposal, KES 6.5M indicative budget | Partner page narrative | Reference |
| CBO MANAGEMENT/ENKITATI Women CBO.docx | Registration guide, Nasieku Foundation constitution, strategic plan 2026–2030, logo concept | Values, logo brief | Reference |
| CBO MANAGEMENT/CBO OPERATIONAL MANUAL.docx | Meetings, finance rules, project cycle, reporting | Accountability statement | Reference |
| CBO MANAGEMENT/BUDGET BREAKDOWN PER OBJECTIVE.docx | KES 1,570,000 annual budget by objective | Partner page "what your gift funds" | Use (summary only) |
| PROPOSALS/FULL DONOR PROPOSAL 1- with Budget.docx | One-year proposal, KES 1,570,000 | Downloadable profile (after review) | Reference |
| CBO MANAGEMENT/BANK ACCOUNT OPENING RESOLUTION LETTER.docx | Signatories, two-signature rule | None | Exclude |
| ACTIVITIES/CBOs CALENDER and IMORTANT ACTIVITIES.docx | 15 advocacy days with activities | Events seed data | Use |
| ACTIVITIES/DAY OF AN AFRICAN CHILD - OloolToto Comprehensive.docx | 16 June 2026 concept note, programme, sponsor tiers (KES 20k–200k+), KES 375k budget | Event page, sponsorship tiers | Use (rename) |
| ACTIVITIES/MENSTRUAL HEALTH & HYGYINE.docx | MHM facts, myths vs facts, messages | MHM program page, blog post | Use |
| DEPARTMENTS/ECONOMIC EMPOWERMENT/VSLA FULL SYSTEM BOOKLET - Table Banking.docx | VSLA rules, passbook templates | "How our VSLA works" summary | Use (rules only) |
| DEPARTMENTS/ECONOMIC EMPOWERMENT/Enkitati\_Women\_CBO\_VSLA\_Register.xlsx | 16 member names and roles; empty savings sheet | None | Exclude |
| DEPARTMENTS/IGNITE DREAMS INITIATIVE/HIGH SCHOOL MENTORSHIP TOPICS.docx | 10 topics with talking points | Mentorship page | Use (topic list) |
| DEPARTMENTS/IGNITE DREAMS INITIATIVE/PRIMARY SCHOOL MENTORSHIP TOPICS.docx | 10 topics with talking points | Mentorship page | Use (topic list) |
| DEPARTMENTS/IGNITE DREAMS INITIATIVE/Catchy Mentorship Program Names and Slogans.docx | Programme names, slogans, hashtags | Microcopy, social | Reference |
| PERSONAL DOC/NASIEKU - MY STORY/My story.docx (+ PDF duplicate) | Founder's personal story | Founder's story page | Use (approved) |
| PERSONAL DOC/CURICULUM VITAE.docx | Founder CV | Short founder bio | Use (bio only) |
| PERSONAL DOC/PassPort and Signature/passport photo.jpeg | ID-style photo | None, replace with portrait | Exclude |
| PERSONAL DOC/PassPort and Signature/signature.jpeg | Handwritten signature | None | Exclude, sensitive |
| REG/ENKAJI ENKITATI Name search.pdf | BRS receipt with ID number, phone, email | None | Exclude, sensitive |
| REG/REQ FOR REG/ENKAJI ENKITATI MEMBERS LIST.docx | Names, phones, national ID numbers | None | Exclude, sensitive |
| REG/REQ FOR REG/Book1.xlsx | Clothing orders for a separate business | None | Exclude, unrelated |

**Sensitive data:** four files hold national ID numbers, personal phone numbers or a signature. They must not be committed to the website repo or uploaded to the CMS. Keep the source pack outside the project directory.

## 4. Stakeholders and user personas

The site serves five audiences. Donors and partners are the main conversion target. Community members and schools are the main reach target.

| Persona | Who | Goal on the site | Key pages | Success action |
| --- | --- | --- | --- | --- |
| Institutional donor | Foundation, NGO, embassy small-grants officer, UN agency (UN Women, UNICEF, Plan International, Amref) | Check legitimacy, programmes, SDG fit, governance, budget | About, Programs, Impact & SDGs, Governance, Partner | Download profile, send partnership enquiry |
| Corporate / event sponsor | Local business, bank, telco CSR team | Pick a sponsorship tier for an event | Event page, Partner | Sponsorship enquiry by tier |
| Individual giver | Kenyan diaspora, friends, local well-wishers | Give quickly and trust the money is used well | Donate, Programs | M-PESA gift (Phase 2), pledge form (Phase 1) |
| Community and schools | Women in Ewaso Ng'iro, school heads, parents, county officials | Learn about VSLA, mentorship visits, upcoming events | Programs, Events, Contact | Join enquiry, school visit request |
| Volunteer | Students, young professionals, mentors | Find roles and sign up | Get Involved | Volunteer form |
| Admin (internal) | CBO Secretary, Organizing Secretary, Kelvin as super admin | Publish news, events, photos; read form submissions | CMS | Content published |

### 4.1 Admin roles

| Role | Can do |
| --- | --- |
| Super Admin | Everything: users, settings, payments config, deletes |
| Editor | Create, edit and publish news, events, gallery, programs, pages |
| Contributor | Create drafts only; an Editor publishes |
| Viewer | Read form submissions and donation records |

## 5. Sitemap and page requirements

The site has 11 public sections and 5 program sub-pages. The primary navigation shows Home, About, Programs, Events, News, Get Involved and Contact, with a persistent "Donate" button.

&#91;embedded content: sitemap · 11 sections in 3 groups\]

The third column carries the conversions; legal pages and `/admin` sit outside the public navigation.

| Route | Page | Required content | Data source |
| --- | --- | --- | --- |
| `/` | Home | Hero with tagline and two CTAs (Donate, Partner with us); 5 program cards; "Where we work" map of Ewaso Ng'iro; next 3 events; latest 3 news; SDG strip (1, 3, 4, 5, 8, 13); partner logos (hidden when empty); newsletter signup | CMS: Home global, Programs, Events, News |
| `/about` | Who we are | Story, vision, mission, values, area of operation, constitutional objectives, community-led approach | CMS: About page |
| `/about/leadership` | Leadership | Officials as cards (photo, name, role, short bio); no phone or ID shown | CMS: Team collection |
| `/about/founder` | Founder's story | "My Story as a Young Maasai Girl" by Caren Naeku Dapash (approved for publishing) plus a short bio from the CV | CMS: Page |
| `/about/governance` | Governance and accountability | Committee structure, meeting rules, two-signature rule, reporting cycle (monthly finance, quarterly activity, annual report); downloadable constitution (redacted) | CMS: Page + Documents |
| `/programs` | Programs index | 5 program cards with icon, summary, SDG badges | CMS: Programs |
| `/programs/[slug]` | Program detail | Problem, what we do, activities, projects, SDGs, related events/news, gallery strip, CTA "Fund this program" | CMS: Programs |
| `/impact` | Impact and SDGs | SDG alignment table; targets (labelled "2026–2030 targets" until real results exist); annual reports | CMS: Impact global, Documents |
| `/events` | Events | Upcoming list and month view; past events archive; filter by program | CMS: Events |
| `/events/[slug]` | Event detail | Date, venue, theme, programme agenda, sponsorship tiers, register/RSVP, add-to-calendar (.ics), photo recap after the event | CMS: Events |
| `/news` | News and stories | Paginated posts, category filter, search | CMS: Posts |
| `/news/[slug]` | Article | Rich text, cover image, author, share buttons, related posts | CMS: Posts |
| `/gallery` | Gallery | Albums by event/program; lightbox; lazy-loaded images | CMS: Albums, Media |
| `/get-involved` | Get involved | Volunteer roles and form; school visit request; join the CBO (adult women in area) enquiry | Forms |
| `/partner` | Partner with us | Why partner, programme budget summary (KES 1,570,000 annual plan by objective), sponsor tiers, downloadable organization profile PDF, enquiry form | CMS + Forms |
| `/donate` | Donate | Phase 1: M-PESA Paybill/Till and bank details shown from settings, pledge form. Phase 2: STK Push form with amount presets | Settings, Donations |
| `/contact` | Contact | Narok location, info@enkajienkitaticbo.org, +254 721 500197 (tap-to-call and WhatsApp), map, contact form, social icons | Settings, Forms |
| `/privacy`, `/terms`, `/safeguarding` | Legal | Privacy notice (KDPA), terms of use, child safeguarding and image-consent policy | CMS: Pages |
| `/admin` | CMS | Authenticated admin panel | Payload |

### 5.1 Global elements

- Header: logo, navigation, Donate button; sticky with a shrink-on-scroll effect.
- Footer: logo, tagline, quick links, email, phone, location, social icons, newsletter signup, copyright. No registration or certificate number.
- Cookie and analytics consent banner.
- 404 and 500 pages written in the site's voice, linking back to Programs and Contact.

## 6. Functional requirements

Priority uses MoSCoW: **M** = must have for launch, **S** = should have for launch, **C** = could have (Phase 2).

### 6.1 Content management

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-CMS-01 | Admins sign in with email and password; sessions expire after 8 hours idle; 5 failed attempts lock the account for 15 minutes | M |
| FR-CMS-02 | Role-based access per section 4.1, enforced on the server for every collection | M |
| FR-CMS-03 | Collections: Programs, Events, Posts, Albums, Media, Team, Partners, Documents, Pages, FormSubmissions, Donations, Subscribers | M |
| FR-CMS-04 | Globals: Site Settings (email, phone, location, social links, Paybill/Till, bank details), Home, About, Impact. Bank and M-PESA details are entered by an admin, never hard-coded | M |
| FR-CMS-05 | Draft, preview and publish workflow with version history and restore | M |
| FR-CMS-06 | Rich-text editor with headings, lists, links, images, embedded YouTube | M |
| FR-CMS-07 | Image upload converts to WebP, creates 4 responsive sizes, requires alt text and a focal point | M |
| FR-CMS-08 | Each image and Team entry carries a "consent on file" checkbox; unchecked items cannot be published | M |
| FR-CMS-09 | SEO fields per document: meta title, description, share image; sensible defaults when empty | M |
| FR-CMS-10 | Scheduled publishing for posts and events | S |
| FR-CMS-11 | Audit log of create, update, publish and delete actions with user and time | S |

### 6.2 Programs

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-PRG-01 | Program has title, slug, icon (Lucide name), summary, problem, activities list, projects list, SDG tags, cover image, order | M |
| FR-PRG-02 | Detail page lists related events and posts automatically by program tag | M |
| FR-PRG-03 | Seed the 5 programs from section 2.4, with the mentorship topics (10 primary, 10 high school) as a list on Education and Mentorship | M |

### 6.3 Events

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-EVT-01 | Event has title, slug, start/end (Africa/Nairobi), venue, theme, program tags, agenda items, cover, status (upcoming / past / cancelled) | M |
| FR-EVT-02 | Events auto-move to the past archive after their end time | M |
| FR-EVT-03 | Add-to-calendar download (.ics) and Google Calendar link | S |
| FR-EVT-04 | Optional sponsorship tiers per event (name, minimum KES, benefits), shown as cards; default tiers Platinum 200,000+, Gold 100,000+, Silver 50,000+, Bronze 20,000+ | S |
| FR-EVT-05 | RSVP form with name, phone or email, organization, number attending; capacity limit closes RSVPs | S |
| FR-EVT-06 | Seed the 15 advocacy days from section 2.7 as drafts for the current year | S |

### 6.4 News and gallery

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-NEWS-01 | Posts with categories (News, Stories, Press, Reports), author, publish date, reading time | M |
| FR-NEWS-02 | Paginated list (9 per page), category filter, full-text search | M |
| FR-NEWS-03 | Share to WhatsApp, Facebook, X and LinkedIn; copy link | S |
| FR-NEWS-04 | RSS feed at `/news/rss.xml` | C |
| FR-GAL-01 | Albums link to an event or program; masonry grid; keyboard-accessible lightbox | M |

### 6.5 Forms

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-FRM-01 | Forms: Contact, Volunteer, Partnership enquiry, School visit request, Join the CBO, Donation pledge | M |
| FR-FRM-02 | Server-side validation with Zod; Kenyan phone numbers normalised to 2547XXXXXXXX / 2541XXXXXXXX | M |
| FR-FRM-03 | Spam protection: Cloudflare Turnstile plus honeypot field; rate limit 5 submissions per IP per 10 minutes | M |
| FR-FRM-04 | Each submission is stored in the CMS and emailed to the official address; the sender gets an acknowledgement email | M |
| FR-FRM-05 | Consent checkbox with a link to the privacy notice on every form | M |
| FR-FRM-06 | Admin can export submissions to CSV | S |

### 6.6 Donations

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-DON-01 | Phase 1: Donate page shows Paybill/Till, account reference and bank details from Site Settings; hidden until set | M |
| FR-DON-02 | Phase 1: pledge form records name, contact, amount, program and preferred channel | M |
| FR-DON-03 | Phase 2: M-PESA STK Push via Safaricom Daraja; presets KES 500 / 1,000 / 2,500 / 5,000 and custom amount; program designation | C |
| FR-DON-04 | Phase 2: callback endpoint verifies the result, matches CheckoutRequestID, is idempotent, and stores MpesaReceiptNumber | C |
| FR-DON-05 | Phase 2: donor receives an SMS or email receipt; admin sees a donations table with filters and CSV export | C |
| FR-DON-06 | Card and international giving (e.g. Paystack, PayPal) for the diaspora | C |

### 6.7 Newsletter and social

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-NL-01 | Signup with double opt-in; unsubscribe link in every email | S |
| FR-NL-02 | Subscribers sync to a mailing provider (Brevo or Mailchimp) | C |
| FR-SOC-01 | Social icons (Facebook, Instagram, X, TikTok, YouTube, LinkedIn, WhatsApp) in header and footer; admins paste each URL in Site Settings and an icon without a URL is hidden. Open Graph images per page | M |

### 6.8 Documents

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-DOC-01 | Public document library: organization profile, redacted constitution, annual reports; each with title, type, year, file | S |
| FR-DOC-02 | Uploads accept PDF only, up to 10 MB | M |

### 6.9 Placeholder activity content

The site launches with 8 past activities and 3 upcoming events so that Events, News and Gallery are not empty. All are **placeholders** drawn from the CBO's calendar and program files. They carry no beneficiary counts, so the site makes no false claims.

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-SEED-01 | Every seed record has `isPlaceholder: true`; the admin shows a "Placeholder" badge and a filter to find them | M |
| FR-SEED-02 | Replacing a placeholder (new photos, real text) clears the flag; the Super Admin dashboard counts the placeholders still left | M |
| FR-SEED-03 | Seed images use the illustrated, bead-pattern placeholder set (section 9.3), never stock photos of people | M |

| Date | Activity | Program | Placeholder summary |
| --- | --- | --- | --- |
| 28 May 2026 | Menstrual Hygiene Day school talk and dignity-pack drive | Girls' Dignity and Health | Myth-vs-fact session with girls and boys; sanitary towels and soap handed out |
| 5 Jun 2026 | World Environment Day tree planting | Community Development | Members and pupils planted indigenous seedlings around a school compound |
| 16 Jun 2026 | Day of the African Child celebration | Education and Mentorship | Theme on water, sanitation and hygiene; talent showcase, mentorship talk, handwashing demo |
| Jul 2026 | Founding meeting and election of officials | News | Members adopted the constitution and elected the executive committee |
| Aug 2026 | First VSLA (table banking) meeting | Women Economic Empowerment | Savings rules agreed; members bought their first shares |
| 12 Aug 2026 | International Youth Day forum | Education and Mentorship | Youth talk on leadership, digital skills and self-employment |
| Sep 2026 | Ignite Dreams primary school visit | Education and Mentorship | "Dream Big Early" and "Importance of Education" sessions |
| Sep 2026 | Beadwork and business skills workshop | Women Economic Empowerment | Pricing, record-keeping and market linkage for beadwork |
| 15 Oct 2026 (upcoming) | International Day of Rural Women | Women Economic Empowerment | Savings group training and women's products exhibition |
| 25 Nov – 10 Dec 2026 (upcoming) | 16 Days of Activism Against GBV | Girls' Dignity and Health | Community awareness walk and school outreach |
| 5 Dec 2026 (upcoming) | International Volunteer Day | Get Involved | Volunteer appreciation and recruitment |

## 7. Non-functional requirements

Most visitors in Narok will be on mid-range Android phones over 3G/4G. Performance and page weight therefore come first.

### 7.1 Performance

| ID | Requirement |
| --- | --- |
| NFR-PERF-01 | Lighthouse mobile score of at least 90 for Performance, Accessibility, Best Practices and SEO on Home, Program detail and Article |
| NFR-PERF-02 | Core Web Vitals at p75 on mobile: LCP under 2.5 s, INP under 200 ms, CLS under 0.1 |
| NFR-PERF-03 | Home page transfer size under 1 MB on first load; JS under 200 KB gzipped |
| NFR-PERF-04 | Static generation with on-demand revalidation when the CMS publishes; no full rebuild needed |
| NFR-PERF-05 | All images served through `next/image` as WebP/AVIF with responsive `sizes`; below-the-fold images lazy-loaded |
| NFR-PERF-06 | Self-hosted fonts via `next/font`, maximum two families |

### 7.2 Security

| ID | Requirement |
| --- | --- |
| NFR-SEC-01 | HTTPS only with HSTS; TLS via Let's Encrypt or Cloudflare |
| NFR-SEC-02 | Security headers: CSP, X-Frame-Options DENY on public pages, Referrer-Policy, Permissions-Policy |
| NFR-SEC-03 | Secrets (DB URL, Payload secret, SMTP, Daraja keys, Turnstile secret) only in environment variables; `.env*` git-ignored; `.env.example` holds names only |
| NFR-SEC-04 | Admin at `/admin` behind rate limiting; optional IP allow-list or Cloudflare Access |
| NFR-SEC-05 | Uploads restricted by MIME type and size; SVG uploads blocked |
| NFR-SEC-06 | Dependencies audited in CI (`npm audit --omit=dev`, Dependabot) |
| NFR-SEC-07 | Daraja callback URL uses a secret path token and validates payload shape; never trusts the client for payment status |
| NFR-SEC-08 | Daily encrypted database backup kept 30 days; media backed up weekly; restore tested before launch |

### 7.3 Privacy and safeguarding

| ID | Requirement |
| --- | --- |
| NFR-PRV-01 | Comply with the Kenya Data Protection Act 2019: privacy notice, lawful basis per form, data minimisation, right to access and deletion by email request |
| NFR-PRV-02 | No registration or certificate numbers, national ID numbers, KRA PINs, signatures or members' personal phone numbers are stored or displayed. The only public phone is +254 721 500197 |
| NFR-PRV-03 | Children are never named with a photo; photos of minors only with guardian consent recorded in the CMS |
| NFR-PRV-04 | Stories touching on FGM, GBV or early marriage use pseudonyms and no identifying images |
| NFR-PRV-05 | Form submissions older than 24 months are purged automatically, except donation records needed for accounts |
| NFR-PRV-06 | Analytics are cookieless (Plausible or Umami) or load only after consent |

### 7.4 Accessibility

| ID | Requirement |
| --- | --- |
| NFR-A11Y-01 | WCAG 2.1 AA: text contrast at least 4.5:1, focus visible, full keyboard navigation, skip link |
| NFR-A11Y-02 | All animation respects `prefers-reduced-motion`; no content depends on motion |
| NFR-A11Y-03 | Touch targets at least 44 × 44 px; forms have labels and inline error messages |
| NFR-A11Y-04 | Semantic landmarks and one `h1` per page |

### 7.5 SEO

| ID | Requirement |
| --- | --- |
| NFR-SEO-01 | Per-page metadata via the Next.js Metadata API; canonical URLs |
| NFR-SEO-02 | `sitemap.xml` and `robots.txt` generated from CMS content |
| NFR-SEO-03 | JSON-LD: `NGO` organization on every page, `Event` on event pages, `Article` on posts, `BreadcrumbList` |
| NFR-SEO-04 | Dynamic Open Graph images for posts and events |
| NFR-SEO-05 | Google Search Console and Bing Webmaster verification |

### 7.6 Reliability and operations

| ID | Requirement |
| --- | --- |
| NFR-OPS-01 | Uptime target 99.5% per month; uptime monitor with alert to the IT lead |
| NFR-OPS-02 | Error tracking (Sentry) on server and client |
| NFR-OPS-03 | CI on every push: typecheck, lint, unit tests, build; deploy only from `main` |
| NFR-OPS-04 | Staging environment mirrors production for content preview and QA |

### 7.7 Compatibility

Latest two versions of Chrome, Safari, Firefox, Edge and Samsung Internet. Layouts tested at 360, 768, 1024 and 1440 px widths. Opera Mini is served readable content without animation.

## 8. Technical architecture and stack

One Next.js application holds both the public site and the Payload CMS admin, backed by PostgreSQL, self-hosted on an Ubuntu VPS behind Nginx and Cloudflare. That is one codebase, one deploy and no CMS subscription.

&#91;embedded content: deployment architecture · 1 VPS, 4 external services\]

The dashed link is Phase 2: Daraja sends the STK Push result back to a callback route in the same app.

### 8.1 CMS options considered

| Option | Pros | Cons | Verdict |
| --- | --- | --- | --- |
| **Payload CMS 3 (inside Next.js)** | Same repo and deploy; TypeScript schemas; roles, drafts, versions and uploads built in; self-hosted, no fees | Needs a Postgres instance and a server you maintain | **Recommended**: lowest running cost and full control |
| Sanity (hosted) | Excellent editor; free tier; no DB to run | Content lives off-site; per-seat costs past the free tier; separate studio | Fallback if no VPS |
| MDX files in Git | Zero infrastructure | Officials can't edit without a developer | Rejected |

### 8.2 Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js (App Router, React Server Components), TypeScript strict |
| CMS | Payload CMS 3 with `@payloadcms/db-postgres` and Lexical rich text |
| Database | PostgreSQL 16 |
| Styling | Tailwind CSS, shadcn/ui on Radix primitives, `class-variance-authority` |
| Motion | Framer Motion (`motion`), wrapped in a `useReducedMotion` guard |
| Icons | Lucide React |
| Forms | React Hook Form + Zod; Next.js Server Actions |
| Email | Nodemailer over SMTP (official domain mailbox) or Resend |
| Spam | Cloudflare Turnstile |
| Media | Payload uploads with Sharp; local disk on VPS, or S3-compatible storage (Cloudflare R2) via `@payloadcms/storage-s3` |
| Payments (Phase 2) | Safaricom Daraja M-PESA Express (STK Push) |
| Analytics | Plausible or Umami (cookieless) |
| Monitoring | Sentry, UptimeRobot |
| Testing | Vitest (units), Playwright (E2E smoke on key flows) |
| Hosting | Ubuntu 24.04 VPS, Node 22 LTS or newer, PM2, Nginx reverse proxy, Cloudflare DNS/CDN |
| CI/CD | GitHub Actions: check, build, deploy over SSH |

Exact package versions are pinned in `package.json` at build time, and the Payload version must match its supported Next.js range.

### 8.3 Data model

| Collection | Key fields |
| --- | --- |
| users | name, email, role (super-admin, editor, contributor, viewer) |
| media | file, alt (required), caption, credit, consentOnFile, focalPoint |
| programs | title, slug, icon, summary, problem, activities\[\], projects\[\], sdgs\[\], cover, order |
| events | title, slug, startsAt, endsAt, venue, theme, programs\[\], agenda\[\], sponsorTiers\[\], rsvpEnabled, capacity, cover, status |
| posts | title, slug, excerpt, body, category, programs\[\], cover, author, publishedAt |
| albums | title, slug, event?, program?, images\[\] |
| team | name, role, bio, photo, order, consentOnFile |
| partners | name, logo, url, tier, order |
| documents | title, type, year, file (PDF) |
| pages | title, slug, blocks\[\] (hero, richText, cta, cards, faq) |
| form-submissions | formType, data (JSON), consent, ip hash, createdAt |
| donations | name?, phone, amount, program?, channel, status, checkoutRequestId, mpesaReceipt, rawCallback |
| subscribers | email, status (pending, confirmed, unsubscribed), token |

**Globals:** site-settings (org name, tagline, location, email, phone, whatsapp, socials{facebook, instagram, x, tiktok, youtube, linkedin}, paybill, till, accountReference, bankName, bankBranch, accountName, accountNumber, donateEnabled), home, about, impact.

### 8.4 Project structure

```text
enkaji-enkitati-web/
  src/
    app/
      (frontend)/          public routes, layout, globals.css
      (payload)/admin/     Payload admin
      api/                 mpesa callback, revalidate, rss
    collections/           Payload collection configs
    globals/
    components/
      ui/                  shadcn components
      motion/              Reveal, Stagger, HoverLift
      sections/            Hero, ProgramGrid, EventList ...
    lib/                   payload client, mpesa, mail, phone, seo
    seed/                  programs, events, pages seed data
  public/
  tests/
  payload.config.ts
  .env.example
```

### 8.5 Environment variables

`DATABASE_URI`, `PAYLOAD_SECRET`, `NEXT_PUBLIC_SITE_URL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`, `CONTACT_INBOX`, `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `REVALIDATE_SECRET`, `SENTRY_DSN`. Phase 2: `MPESA_ENV`, `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_SHORTCODE`, `MPESA_PASSKEY`, `MPESA_CALLBACK_TOKEN`. All are secrets except `NEXT_PUBLIC_*` and the Turnstile site key.

## 9. Design direction

The brand comes from the approved logo. It shows a Maasai enkaji (house) dome in forest green, a gold path climbed by a girl carrying a book toward a rising sun, and a cream-and-gold bead-diamond band. The site carries that same palette, the serif wordmark and the bead pattern, kept restrained.

### 9.1 Colour tokens

The hex values below were sampled from the logo file (1024 × 1024 JPEG). The earlier brochure orange and brown are dropped because they are not in the logo.

| Token | Hex | Sampled from | Use |
| --- | --- | --- | --- |
| `--primary` forest green | `#1C380E` | Dome, wordmark | Header, headings, primary buttons, footer background |
| `--primary-soft` | `#2E5A1C` | Lighter tint of the dome | Hover states, links |
| `--accent` harvest gold | `#C4A050` | Path, sun | Donate button fill, icons, dividers, highlights |
| `--accent-ink` deep gold | `#7A5C22` | Darker shade of the gold | Gold-coloured text on light backgrounds |
| `--bead` cream | `#EEE3C4` | Bead band | Pattern fills, card tints |
| `--sand` | `#F7F1E1` | Logo background warmth | Section backgrounds |
| `--ink` | `#1C1A17` | n/a | Body text |

Measured contrast: green on white 13.0:1, green on sand 11.5:1, green text on gold 5.2:1 (so the Donate button is gold with green text), deep gold on sand 5.5:1. All pass AA. Harvest gold on white is 2.4:1, so it is never used for text. The site ships in a light theme only.

### 9.2 Typography

- Headings: a classic book serif that echoes the wordmark, e.g. Libre Baskerville or Cormorant Garamond (600), used in mixed case.
- Eyebrow labels and the header wordmark: spaced capitals in the same serif.
- Body: Inter or Source Sans 3, 16–18 px base, line height 1.6.
- Both loaded through `next/font` with `display: swap`.

### 9.3 Imagery

- The pack contains no usable photos. A photo shoot of real activities (VSLA meeting, school mentorship visit, sanitary towel drive, tree planting, beadwork) is a launch dependency.
- Until then, use warm-toned illustrated placeholders or abstract bead-pattern panels, not stock photos posing as the community.
- The founder's portrait must be a proper photo, not the passport image.

### 9.4 Logo

The logo is approved and supplied as a 1024 × 1024 JPEG with a white background. For the web it needs:

- An SVG vector (traced or from the designer) for the header, footer and favicon.
- Two lockups: full (mark, wordmark and tagline) for the footer and hero, and horizontal (mark plus wordmark on one line) for the header.
- Mark-only versions at 512, 192, 180 and 32 px for the favicon, Apple touch icon and PWA manifest.
- A one-colour version (cream on green) for the footer and Open Graph image.

Until the SVG exists, use a transparent PNG cut from the JPEG.

### 9.5 Motion rules

| Pattern | Spec |
| --- | --- |
| Section entrance | Fade + 16 px rise via `whileInView`, once, 0.5 s ease-out, viewport amount 0.2 |
| Lists and card grids | Stagger children by 0.06 s |
| Cards and buttons | Hover lift of 2–4 px with a shadow change; tap scale 0.98 |
| Hero | Headline word-stagger; the logo's gold path draws in once (SVG stroke animation); bead-diamond band as a subtle section divider |
| Counters | Count-up on view (used only for real, verified numbers) |
| Reduced motion | All of the above become instant opacity changes or nothing |

### 9.6 Voice

Write warmly and specifically, without pity. Women and girls are agents, not recipients. Never present plans as results: "We aim to reach 200 girls" is fine; "We have reached 200 girls" is allowed only with evidence.

## 10. Open questions, assumptions and content gaps

Kelvin settled the identity, contact, language and governance questions on 11 Oct 2026. Hosting was settled the same day. The build can start in full now; only real activity photos block launch.

### 10.1 Decisions log and remaining questions

**Decided on 11 Oct 2026**

| Topic | Decision |
| --- | --- |
| Officials | Caren Naeku Dapash is Chairperson; Nairuko Karkar is Secretary (full list in 2.5) |
| Official name | Enkaji Enkitati CBO |
| Registration and IDs | Never shown on the site or stored in the CMS |
| Contacts | info@enkajienkitaticbo.org, +254 721 500197, Narok |
| Domain | enkajienkitaticbo.org |
| Bank and M-PESA details | Entered by an admin in Site Settings |
| Social media | Icons built in; links added from admin |
| Language | English only |
| Founder's story | Approved for publishing |
| Past activities | Placeholder content per 6.9 until real records arrive |
| Branding | Taken from the supplied logo (section 9). Hosting: Payload CMS 3 + PostgreSQL on Kelvin's own Ubuntu server (Nginx, PM2) |

**Still open**

| # | Question | Why it matters | Severity |
| --- | --- | --- | --- |
| Q2 | Final vision, mission and values (brochure drafts used until then) | About page copy | Should |
| Q3 | Meaning of "Enkaji Enkitati" in Maa | About story, hero copy | Could |
| Q4 | Officials' portrait photos and one-line bios | Leadership page | Should |

### 10.2 Missing assets

- [x] Logo supplied (JPEG); SVG and favicon set to be derived (9.4).
- [ ] At least 20 consented photos of real activities to replace the placeholders. **Launch blocker**
- [ ] Officials' portrait photos.
- [ ] Redacted constitution PDF and a one-page organization profile PDF (optional at launch).
- [ ] Partner logos with permission to display (section hidden until added).

### 10.3 Assumptions

- Ignite Dreams Initiative is the name of the CBO's mentorship program, shown under Education and Mentorship. The Nasieku Foundation and Nasieku Luxury Creations are separate from the CBO and are not mentioned on the site.
- Hosting is a server Kelvin manages, with root access; Cloudflare sits in front for DNS and CDN.
- Budget and target figures from the drafts are shown only as plans, never as achieved results.
- The 2026 Day of the African Child theme quoted in the activity file is checked against acerwc.africa before it is published.
- VSLA financial records stay offline; the site describes the model only.

### 10.4 Acceptance criteria for launch

- [ ] All "M" requirements in section 6 pass on staging.
- [ ] Lighthouse mobile 90+ on the 3 test pages; zero critical axe-core issues.
- [ ] No national ID, signature or personal phone number anywhere in the repo, CMS or rendered HTML (grep plus a manual check).
- [ ] Committee signs off all public copy and the Leadership page; the remaining placeholder count is reviewed and accepted.
- [ ] Backup restore tested; uptime monitor and Sentry live.
- [ ] Forms deliver to the official inbox and send acknowledgements.

Build prompts for Claude Code: Build prompts
