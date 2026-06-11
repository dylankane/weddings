# Wedding Hire Platform — Architecture & Context Document

This document is the single source of truth for the backend architecture. Any agent picking up work should read it in full before writing a line of code. It covers the full stack, every architectural decision, the reasons behind them, and the current build status. It does not prescribe frontend design, page structure, or UI patterns — those decisions belong to the frontend agent.

---

## Project Overview

A rental management platform for a small Irish wedding hire business. The business rents decorative and practical wedding items — currently two cast iron post boxes (different styles), with more products added over time.

The platform has two parts:
1. **Public website** — for customers to browse products and submit enquiries
2. **Admin backend** — the manager's tool for handling enquiries, bookings, products, quotes, invoices, and settings

Everything is manual by design — no payment processing, no customer portal, no automated confirmations. The manager handles all communication off-platform (email, phone, WhatsApp). The system tracks what's agreed and holds dates.

---

## Second Business — Why Everything Is Namespaced

This client may also want a second product built in future: a **wedding website builder** — a tool that creates and hosts simple wedding information pages for couples.

This is why every file, route, and database table in this project is namespaced under `rental`:

- All admin controllers: `controllers/admin/rental/`
- All admin routes: `/admin/rental/bookings`, `/admin/rental/enquiries`, etc.
- All admin views: `views/admin/` (enquiries, bookings, etc. sit directly inside)
- All Prisma models: `@@schema("rental")` — tables live in the `rental` PostgreSQL schema, not `public`
- The dashboard at `/admin/dashboard` is product-agnostic — it's the home for the whole admin regardless of which products exist

If a wedding website product is built later, it lives at:
- `controllers/admin/wedding-sites/`
- `/admin/wedding-sites/`
- `views/admin/` would need renaming at that point — the current flat structure works for one product, can be reorganised when a second is added
- `@@schema("wedding_sites")`

No existing files move. No routes change. This namespacing cost nothing to do upfront and would be expensive to retrofit.

---

## Naming Conventions

These are non-negotiable and were set explicitly at the start of the project.

- **No abbreviations** — `enquiriesController.js`, not `enqCtrl.js`
- **No generic names** — `admin.css` is acceptable as a scope name, but `style.css`, `main.js`, `helpers.js` are not
- **Plural nouns for collections** — `enquiries`, `bookings`, `products`
- **kebab-case for files and folders** — `delivery-zones`, `product-detail.njk`
- **camelCase for JS** — controllers, services, models
- **Controller files are named after the resource** — `enquiriesController.js` handles `/rental/enquiries/*`
- **Slug vs ID** — products use `slug` in public URLs, IDs in admin URLs

---

## Stack

| Concern | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express 4 |
| Database | PostgreSQL 17 (local), Plesk VPS (production) |
| ORM | Prisma 6 (stable multiSchema, no previewFeatures needed) |
| Templating | Nunjucks 3 |
| Auth | express-session + connect-pg-simple (PostgreSQL session store) |
| File uploads | multer v2 |
| Media storage | Local disk `/public/uploads` — Cloudflare R2 when scaling |
| Email | AWS SES via Nodemailer |
| Maps/Geocoding | Google Maps Platform (server-side only, API key never in browser) |
| PDF generation | puppeteer-core + @sparticuz/chromium |
| Password hashing | bcrypt |
| Rate limiting | express-rate-limit |
| Hosting | Plesk VPS |
| Slug generation | slugify |

---

## Build Phases

### Phase 1 — Foundation (COMPLETE)
Database schema, Prisma setup, migrations, seed data, Express app, session config, middleware, route scaffolding.

### Phase 2 — Services (COMPLETE)
All business logic services written and tested.

### Phase 3 — Admin controllers and views (COMPLETE)
All admin controllers written. All admin views exist as plain unstyled HTML — no CSS classes, just semantic HTML that renders data. The admin backend is fully functional.

### Phase 4 — Public frontend (NOT STARTED)
Public routes, controllers, templates, and all CSS/JS files are blank. The backend models, services, and availability logic are all ready to be wired up.

---

## Directory Structure

```
/
  app.js                          — Express app entry point
  package.json
  .env                            — local env vars (not committed)
  .env.example
  /prisma
    schema.prisma                 — all models, @@schema("rental") on every model
    seed.js                       — creates dev users, company settings, products, email templates, delivery zones
  /routes
    admin.js                      — all admin routes (requireAuth + requireRole on everything)
    public.js                     — public site routes (empty, to be built)
  /controllers
    /admin
      authController.js
      dashboardController.js
      usersController.js
      /rental
        enquiriesController.js
        bookingsController.js
        productsController.js
        quotesController.js
        invoicesController.js
        deliveryZonesController.js
        settingsController.js
    /public                       — public site controllers (empty, to be built)
  /middleware
    auth.js                       — requireAuth, saves returnTo in session
    roleCheck.js                  — requireRole(allowedRoles)
  /services
    /admin
      mapsService.js              — Google Maps API calls
      deliveryService.js          — venue resolution, zone suggestion, API usage logging
      storageService.js           — file save/delete abstracted for local disk → R2 swap
      pdfService.js               — generates quote and invoice PDFs as buffers
    /shared
      availabilityService.js      — checks product availability for a date range
      emailService.js             — sends emails via AWS SES/Nodemailer
    /public                       — public-only services (empty, to be built)
  /models
    auditLog.js                   — createAuditLog helper
  /lib
    prisma.js                     — singleton PrismaClient
    upload.js                     — multer config (image-only, size limit from env)
  /views
    /admin
      dashboard.njk
      /base
        layout.njk                — admin HTML shell
        nav.njk                   — included in layout.njk
      /auth
        login.njk
        account-password.njk
      /macros
        status-badge.njk
        confirm-modal.njk
        audit-entry.njk
        form-field.njk
        pagination.njk
        breadcrumb.njk
        data-card.njk
      /enquiries
        list.njk, detail.njk, edit.njk, create.njk
      /bookings
        list.njk, detail.njk, edit.njk, create.njk
      /products
        list.njk, detail.njk, edit.njk, create.njk
      /quotes
        detail.njk, create.njk
      /invoices
        detail.njk, create.njk
      /settings
        index.njk
      /delivery-zones
        create.njk, edit.njk
      /users
        create.njk, edit.njk
      /documents                  — rendered by puppeteer for PDF — DO NOT TOUCH
        quote.njk
        invoice.njk
    /public                       — public site templates (empty, to be built)
    /shared
      sprite.html                 — SVG symbol sprite, included in both layouts
    /emails                       — Nunjucks templates rendered by emailService
      enquiry-acknowledgement.njk
      new-enquiry-notification.njk
      quote-send.njk
      invoice-send.njk
    /errors
      403.njk, 404.njk, 500.njk
  /public
    /css
      /admin
        base.css                  — all admin styles
      /public
        base.css                  — all public styles (empty, to be built)
    /js
      /admin
        base.js                   — all admin JS (empty, to be built)
      /public
        base.js                   — all public JS (empty, to be built)
    /images
      /admin                      — static images for admin UI
      /public                     — static images for public site
    /uploads                      — multer writes here; will move to R2 later
```

---

## Nunjucks — Template Context

### Globals (available in every template)
Set in `app.js` via `nunjucksEnv.addGlobal`:
- `appUrl` — e.g. `http://localhost:3000` (from `.env`)
- `currentYear` — integer, used in footer copyright

### Middleware-injected locals (every request)
- `sessionUser` — the logged-in user object `{ id, displayName, email, role }`, or `null`

### Filters
- `{{ date | dateFormat('short') }}` — e.g. "9 Jun 2026"
- `{{ date | dateFormat('datetime') }}` — e.g. "9 Jun 2026, 14:30"
- `{{ date | dateFormat }}` — long format, e.g. "9 June 2026"
- `{{ date | timeAgo }}` — e.g. "3 hours ago"
- `{{ value | currency }}` — e.g. "€99.99"

### The `section` variable
Every admin controller passes a `section` string to the template. Used to apply active state to the nav item.

---

## Admin Routes Reference

All admin routes require authentication. Mounted at `/admin` in `app.js`.

```
GET  /admin/login
POST /admin/login               (rate limited: 10/15min)
POST /admin/logout
GET  /admin/account/password
POST /admin/account/password
GET  /admin/dashboard

GET  /admin/rental/enquiries
GET  /admin/rental/enquiries/create
POST /admin/rental/enquiries/create
GET  /admin/rental/enquiries/:id
GET  /admin/rental/enquiries/:id/edit
POST /admin/rental/enquiries/:id/edit
POST /admin/rental/enquiries/:id/status
POST /admin/rental/enquiries/:id/archive

GET  /admin/rental/bookings
GET  /admin/rental/bookings/create
POST /admin/rental/bookings/create
GET  /admin/rental/bookings/:id
GET  /admin/rental/bookings/:id/edit
POST /admin/rental/bookings/:id/edit
POST /admin/rental/bookings/:id/status
POST /admin/rental/bookings/:id/cancel
POST /admin/api/delivery/calculate  (AJAX — returns JSON, manager only)

GET  /admin/rental/products
GET  /admin/rental/products/create
POST /admin/rental/products/create
GET  /admin/rental/products/:id
GET  /admin/rental/products/:id/edit
POST /admin/rental/products/:id/edit
POST /admin/rental/products/:id/deactivate
POST /admin/rental/products/:id/images/upload       (multipart)
POST /admin/rental/products/:id/images/:imageId/delete
POST /admin/rental/products/:id/images/:imageId/primary

GET  /admin/rental/quotes/create?enquiryId=X
POST /admin/rental/quotes/create
GET  /admin/rental/quotes/:id
POST /admin/rental/quotes/:id/send
POST /admin/rental/quotes/:id/status

GET  /admin/rental/invoices/create?bookingId=X
POST /admin/rental/invoices/create
GET  /admin/rental/invoices/:id
POST /admin/rental/invoices/:id/send
POST /admin/rental/invoices/:id/status

GET  /admin/settings?tab=company|delivery|email-templates|users
POST /admin/settings/company
POST /admin/settings/company/logo                   (multipart)
POST /admin/settings/email-templates/:id

GET  /admin/rental/delivery-zones/create
POST /admin/rental/delivery-zones/create
GET  /admin/rental/delivery-zones/:id/edit
POST /admin/rental/delivery-zones/:id/edit
POST /admin/rental/delivery-zones/:id/deactivate

GET  /admin/users/create
POST /admin/users/create
GET  /admin/users/:id/edit
POST /admin/users/:id/edit
POST /admin/users/:id/deactivate
```

---

## Authentication & Roles

- Sessions stored in PostgreSQL (`rental.session` table, created automatically by connect-pg-simple)
- Cookie: httpOnly, secure in production, sameSite lax, 8 hour maxAge
- `requireAuth` middleware: redirects to `/admin/login` if no session, saves `returnTo` URL
- `requireRole(['SUPER_ADMIN', 'MANAGER'])` middleware: used on all admin routes
- Roles: `SUPER_ADMIN` (developer), `MANAGER` (business owner) — both have identical access currently
- `CLIENT` role exists in the schema as a placeholder for a future customer portal — no routes built for it

Seed accounts (password: `ChangeMe123!`):
- `dev@example.com` — SUPER_ADMIN
- `manager@example.com` — MANAGER

---

## Status Values

These are the enum values used across the system. The frontend can style them however it chooses.

**Enquiry:** `NEW`, `PENDING`, `CONVERTED`, `ARCHIVED`

**Booking:** `PROVISIONAL`, `CONFIRMED`, `COMPLETED`, `CANCELLED`

**Quote:** `DRAFT`, `SENT`, `ACCEPTED`, `REJECTED`, `EXPIRED`

**Invoice:** `DRAFT`, `SENT`, `PAID`, `OVERDUE`

**User / Product / DeliveryZone:** `isActive` boolean — true means active, false means deactivated

---

## Business Logic — How the System Works

### Customer Enquiry Flow

1. Customer submits an enquiry — selects products and quantities, provides wedding date, venue details, and contact info
2. Venue name is required plus at least one of — venue address or Eircode. This is frontend validation only; the model keeps these fields nullable to allow manager-created bookings without the same constraints
3. Enquiry submitted → a `Customer` record and `Enquiry` record are created, `EnquiryItem` records each product and quantity requested
4. Customer receives an acknowledgement email; manager receives a notification email
5. All further communication happens off-platform — email, phone, or message

### Manager Enquiry Flow

1. Manager receives notification of a new enquiry
2. Manager opens the enquiry in the admin — status auto-transitions from `NEW` to `PENDING` on first view
3. Manager reviews requested products, dates, venue location
4. From this point the manager has full flexibility:
   - Contact the customer and do nothing in the system yet
   - Create a quote and send it externally
   - Create a `PROVISIONAL` booking — this softly holds the dates and shows them as pending on the availability checker. The provisional has a manager-set expiry period. It can be removed at any time to return dates to free.
   - Skip provisional and go straight to a `CONFIRMED` booking
5. When the customer confirms, the manager confirms the booking — the enquiry status becomes `CONVERTED`
6. After the event and items are returned, manager marks the booking `COMPLETED`

### Booking Without an Enquiry

Managers can create a booking directly from a phone call, WhatsApp, email, or walk-in. The enquiry link on a booking is optional. The same booking status flow applies.

### Availability Logic

For a given product and date range:

```
available quantity = product.stock_quantity
                   - SUM of BookingItem.quantity
                     where booking status is PROVISIONAL or CONFIRMED
                     and booking dates overlap the requested range
```

This accounts for products with multiple units in stock — one unit booked does not block a second unit from being hired for the same dates.

### Delivery Calculator (Manager Tool)

1. Manager looks up a venue by name, address, or Eircode
2. Resolution logic:
   - Eircode detected → Geocoding API called directly
   - Structured address → Geocoding API called
   - Venue name only → Places Text Search called, returns found / multiple options / not found
3. If multiple results returned, manager selects the correct venue
4. Once coordinates are resolved, Distance Matrix API calculates road distance from the business location (stored in `CompanySettings`)
5. System matches road distance against `DeliveryZone` records and suggests the applicable zone and price
6. Manager confirms or overrides the delivery cost and saves to the booking

---

## External Services — Google Maps Platform

| API | Purpose | Triggered By |
|---|---|---|
| Geocoding API | Address or Eircode → coordinates | Manager delivery tool |
| Distance Matrix API | Road distance between two points | Manager delivery tool |
| Places Text Search | Venue name → address and coordinates | Manager delivery tool |

All API calls are made server-side from `services/admin/mapsService.js`. The API key is never exposed to the browser.

### API Cost Protection

**Layer 1 — In-app tracking:** Every API call is logged to `ApiUsageLog`. The dashboard shows a warning when usage reaches 90% of the monthly budget threshold.

**Layer 2 — Google Cloud budget alert:** Email notification to developer when spend reaches a threshold.

**Layer 3 — Hard quota cap:** Set in Google Cloud Console. If hit, the API returns errors rather than charging. The app handles this gracefully.

---

## Email Service

All email via AWS SES / Nodemailer. Credentials in `.env`.

| Trigger | Recipient | Template |
|---|---|---|
| Enquiry submitted | Customer | `enquiry-acknowledgement.njk` |
| Enquiry submitted | Manager | `new-enquiry-notification.njk` |
| Quote sent | Customer | `quote-send.njk` |
| Invoice sent | Customer | `invoice-send.njk` |

Subject lines for all triggers are stored in `EmailTemplate` DB records, editable by the manager from settings.

---

## PDF Generation

Puppeteer renders `views/admin/documents/quote.njk` or `views/admin/documents/invoice.njk` to HTML, captures as PDF buffer. Buffer is attached to emails — PDFs are never written to disk.

**Do not modify the document templates** — they have inline styles designed for PDF output.

---

## File Storage

Images stored at `/public/uploads` locally. Database stores the relative file path. All file operations go through `services/admin/storageService.js` only. Migrating to Cloudflare R2 later requires changing one service file only.

---

## Schema (all models in `@@schema("rental")`)

All models use Prisma camelCase field names mapped to snake_case columns.

Key relationships:
```
User ──< AuditLog
User ──< ApiUsageLog
User ──< Booking (createdBy)
User ──< Quote
User ──< Invoice
Customer ──< Enquiry
Customer ──< Booking
Product ──< ProductImage
Product ──< ProductCustomisationOption
Product ──< EnquiryItem
Product ──< BookingItem
Enquiry ──< EnquiryItem
Enquiry ──< Booking
Enquiry ──< Quote
Booking ──< BookingItem
Booking ──< Invoice
BookingItem ──< BookingItemCustomisation
ProductCustomisationOption ──< BookingItemCustomisation
DeliveryZone ──< Booking
```

CompanySettings holds: company name, tagline, four logo variants (light/dark × small/large), contact details, social links, SEO fields, delivery info text, and business lat/lng coordinates.

---

## Seed Data

Running `npm run db:seed` creates:
- 2 user accounts (`dev@example.com` SUPER_ADMIN, `manager@example.com` MANAGER — password: `ChangeMe123!`)
- 1 CompanySettings row (placeholder data)
- 4 EmailTemplate rows
- 2 DeliveryZone rows (Dublin/Wicklow/Kildare free, Rest of Ireland enquire-only)
- 2 Product rows (Cast Iron Post Box - Classic, Cast Iron Post Box - Ornate) with customisation options

---

## Non-Negotiable Build Standards

- Strict separation of concerns — routes, controllers, services, models, views, middleware are never mixed
- No inline CSS ever on any template
- No inline JS ever on any template
- All CSS in named files under `public/css/`
- All JS in named files under `public/js/`
- Logic belongs where it belongs — controllers handle requests, services handle business logic, models handle data, views handle presentation
- File and folder names are descriptive and unambiguous

---

## Local Development Setup

```bash
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Database connection string format: `postgresql://user:password@localhost:5432/wedding_hire?schema=rental`

Session table is created automatically by connect-pg-simple in the `rental` schema on first request.
