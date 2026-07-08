# Audit & Fix Log

## Bugs found and fixed

1. **No email verification existed at all**, despite `isVerified` on the `User`
   model and the register endpoint literally saying *"Please verify your
   email."* There was no OTP table field, no send-code endpoint, no verify
   endpoint, no frontend page, and no email-sending code anywhere
   (`nodemailer`/`resend` weren't even installed). Login let unverified users
   straight through. **Fixed** — full OTP flow added, see below.

2. **`PrismaClient` was instantiated 10 separate times** — once in
   `authService.ts`, once in `crudService.ts`, and once inline in *8 different*
   route handlers in `routes/index.ts` (each doing
   `const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient();`).
   Each instance opens its own connection pool; under real load this
   exhausts Postgres connections and leaks connections on every `tsx watch`
   reload in dev. **Fixed** — added `src/lib/prisma.ts` as a single shared,
   hot-reload-safe client used everywhere.

3. **Refresh tokens never actually expired.** `refreshTokens()` looked the
   token up in the DB (`findFirst({ where: { refreshToken } })`) but never
   called `jwt.verify()` on it, so the JWT's own `exp` claim (30 days) was
   never checked — a leaked refresh token worked forever as long as the DB
   row wasn't cleared. **Fixed** — the raw token is now verified against
   `JWT_REFRESH_SECRET` first (rejecting expired/tampered tokens) before the
   DB lookup.

4. **"Continue as Guest" link on the login page was a dead end.** It linked
   to `/dashboard`, which is wrapped in `ProtectedRoute` and checks
   `isAuthenticated` — a guest has no token, so it immediately bounced back
   to `/login`. There was no actual guest-mode implementation anywhere in
   the backend. **Fixed** — removed the broken link (a real guest mode would
   need its own scoped design/backend support, which is out of scope here).

5. **`AppError` had no machine-readable error code**, so the frontend could
   only match on the human-readable `message` string to special-case errors
   (e.g. detecting "please verify your email" by text). **Fixed** — added an
   optional `code` field surfaced in the JSON error response, used for
   `EMAIL_NOT_VERIFIED`.

6. Minor: the duplicate `/profile/change-password` route re-required
   `bcryptjs`/`PrismaClient` inline instead of reusing the shared client —
   cleaned up to use the shared `prisma` singleton.

### Not fixed (flagged, out of scope for this pass)
Many page files (`BOQPage.tsx`, `CalculatorPage.tsx`, `calculations.ts`, etc.)
have `noUnusedLocals` warnings (unused imports/vars) under `tsc --noEmit`.
These don't break functionality and are cosmetic; a full lint pass across
all 30+ pages was outside the scope of "fix the auth/OTP workflow" but is a
quick follow-up (`npm run lint -- --fix` plus manual review of the flagged
files).

## New feature: OTP email verification (Resend primary, SMTP fallback)

- `database/schema.prisma`: added `otpCodeHash`, `otpExpiresAt`,
  `otpAttempts`, `otpLastSentAt` to `User`.
- `backend/src/services/emailService.ts` (new): tries **Resend** first;
  if Resend isn't configured (no `RESEND_API_KEY`) or the send call throws,
  it automatically falls back to **SMTP via Nodemailer**. If neither is
  configured, it logs the email to the console in development instead of
  crashing the request.
- `backend/src/services/authService.ts`:
  - `register()` now generates a 6-digit OTP (crypto-secure), stores a
    **bcrypt hash** of it (never the raw code) with a 10-minute expiry, and
    emails it. Registration succeeds even if the email send fails (user can
    resend).
  - `verifyOtp(email, code)` — checks expiry, attempt count (max 5, then
    must request a new code), compares the hash, and on success marks the
    user verified and returns access/refresh tokens (auto-login).
  - `resendOtp(email)` — 60-second cooldown to prevent spamming the mailbox,
    doesn't reveal whether an email exists.
  - `login()` now returns `403 EMAIL_NOT_VERIFIED` for unverified accounts
    instead of letting them log in.
- New routes: `POST /api/v1/auth/verify-otp`, `POST /api/v1/auth/resend-otp`,
  both behind dedicated stricter rate limiters.
- `frontend/src/pages/auth/VerifyEmailPage.tsx` (new): 6-digit code input
  (auto-advance, paste support, backspace navigation), resend button with a
  visible cooldown timer.
- `RegisterPage.tsx` now routes to `/verify-email` after signup instead of
  `/login`.
- `LoginPage.tsx` detects `EMAIL_NOT_VERIFIED`, silently requests a fresh
  code, and routes to `/verify-email`.
- `forgotPassword()` now actually emails a reset link (previously it just
  silently generated a token and did nothing with it).

## Round 2: Calculator / BOQ / Dashboard audit (as requested)

### The root cause of "BOQ only saves the title, not the data"
`CrudService.list()` and `.getById()` never passed `include` to Prisma, so
any model with child rows — **BOQ.items, Estimation.breakdown,
Inspection.checklist** — had its children created successfully in the DB,
but the API never returned them back. The data was never lost; it was
just invisible. Confirmed by checking `boq.items?.length` in the saved-BOQ
list, which was always `0` for exactly this reason.
- Added a `RELATION_INCLUDES` map to `crudService.ts` so `list`/`getById`/
  `create`/`update` all return their nested relations.
- **Also fixed a second, related bug**: `crudController.update()` never
  applied the array→`{ create: [...] }` transform that `create()` did — so
  editing and re-saving an existing BOQ sent Prisma a raw JS array where it
  expected a relation operation, which Prisma rejects. Both create and
  update now share the same transform, and `update()` does a full
  delete+recreate of the child rows (BOQ items are a full replace each
  save, not an incremental diff, matching how the frontend sends them).

### Data isolation bug found while in there
`BOQ` and `Estimation` had **no `userId` field at all** — every saved BOQ/
estimation was visible to every user in the system, unlike Projects,
Inspections, Notes, etc. which were all properly scoped. Added `userId` to
both models, wired `scopeToUser: true` on their routes, and blocked the
client from spoofing `userId`/`id` on update requests.

### Calculator: default values were decorative, not functional
Input fields displayed `input.defaultValue` via the DOM's uncontrolled
`defaultValue` prop, but the component's actual `inputs` state was only
ever populated by `onChange`. So if you calculated without touching a
field, that field was `undefined` in the real calculation, not the number
on screen. Fixed by seeding `inputs` state from the calculator's defaults
on load and making the fields fully controlled — what's shown is always
what gets calculated and saved, no silent gap between the two.

### Calculator: "Save" wrote to a black hole
`handleSave` posted directly via raw axios, bypassing the app's
`useCreate` react-query hook. Worse: **nothing in the entire frontend ever
read `/saved-calculations` back** — not the calculator page, not the
dashboard (which received the count but never rendered the list). Saved
calculations vanished from view the instant you saved them. Fixed:
- `handleSave` now goes through `useCreate` with a proper query key.
- Added a "History" panel on the calculator page, sharing that query key,
  so it updates the instant a save succeeds — no reload needed.

### BOQ: every new BOQ silently pre-loaded ~20 fake line items
A `useEffect` on mount unconditionally filled a brand-new BOQ with a full
sample project (real-looking numbers: "Earthwork... 150 m³ @ ₹325" etc.).
If you didn't notice and hit Save, that fake dataset became your saved
BOQ. Fixed: a new BOQ now starts genuinely empty with an explicit choice —
"Add Item" or "Load Sample Project" (the sample data is now opt-in, and
loading it shows a toast reminding you to replace the numbers).

### Dashboard: stats and activity feed never refreshed
`stats` and `recentActivities` were fetched once via a bare `useEffect` +
`useState` — completely outside react-query. Saving a calculation,
creating a BOQ, or adding a project anywhere else in the app never
refreshed these numbers; only a full page reload did. Fixed:
- Converted both to react-query (`['dashboard-stats']`, `['activities']`).
- The Calculator save, BOQ save, and Project create/update/delete actions
  now explicitly invalidate those two keys, so the Dashboard reflects the
  change immediately if you navigate back to it.
- The Projects count already shared the `['projects']` query key with the
  Projects page, so that part was already live — confirmed, not changed.

### Dashboard: fake placeholder data disguised as real data
"Favorite Tools" and "Recent IS Codes" fell back to hardcoded arrays
(`['Concrete Mix Design', 'Steel Weight Calculator', ...]` and three
made-up IS codes) whenever the real data was empty — which it always was,
since nothing seeds those. It looked personalized; it wasn't. "Profile
Completion" was a hardcoded `75%` for every single user with zero logic
behind it. Fixed: real empty states with a CTA instead of fake data, and
profile completion is now a genuine ratio of filled-in profile fields
(name/email/phone/bio/avatar).

### Not yet fixed — flagged from the previous review, still open
File uploads (profile picture, project documents) are still not wired up
server-side (multer/cloudinary are installed but unused). Let me know if
you want that built out next — it's a separate, fairly large piece of work
(upload route + Cloudinary integration + frontend dropzone/avatar UI).

## Round 3: Real cloud file storage (Cloudinary) everywhere

Every file upload in the app is now backed by the server + Cloudinary
instead of the browser. New backend pieces:
- `config/cloudinary.ts` — configured Cloudinary SDK.
- `middleware/upload.ts` — Multer memory-storage config: 20 MB limit, one
  file per request, and an extension whitelist (images, PDF, Office docs,
  and CAD formats DWG/DXF/DGN — checked by extension since browsers report
  unreliable MIME types for CAD files).
- `services/uploadService.ts` — streams the buffer straight to Cloudinary
  (no temp files on disk), auto-picks `image` vs `raw` resource type by
  extension, and a matching delete function.
- `controllers/uploadController.ts` + `routes/uploadRoutes.ts` — mounted at
  `/api/v1/uploads`: `POST /` (generic file upload, records a `ProjectFile`
  row), `POST /avatar` (uploads + immediately updates the user's profile
  picture), `GET /` (list, scoped to the uploader), `PUT /:id` (update
  category/notes/rate-analysis metadata), `DELETE /:id` (removes from both
  Cloudinary and the DB). Rate-limited like the other write-heavy routes.
- `ProjectFile` schema gained `category`, `notes`, `rateItems` (Json) so
  Drawings' tagging and rate-analysis data has somewhere to live server-side.

**Found a second ownership bug while wiring this up**: the generic CRUD
controller only knew how to auto-inject a column literally named `userId`.
`DailyProgress` uses `createdById` and `ProjectFile` uses `uploadedById` —
under the old code, scoping either of those would have silently filtered
on a non-existent column, and creating either would never stamp the real
owner. Replaced the flat "list of user-owned models" with a proper
`ownerFieldByModel` map so each model's real column name is used
everywhere (injection, list filter, and the ownership checks on
get/update/delete).

### Drawings — moved from IndexedDB to the cloud
The file storage itself (bytes + preview) already worked correctly, but it
was **per-browser only** — invisible to teammates, gone if you cleared
browser data. Rewrote the page to use `/uploads` (folder: `drawings`):
uploads stream to Cloudinary, the file list is now a live react-query
list, and category/rate-analysis edits save with a 600ms debounce so
typing doesn't fire a network request on every keystroke. Deleted the now
-dead `drawingStorage.ts` (IndexedDB) service entirely.

### Profile picture — the camera button did nothing; now it works
The camera icon on the Profile page rendered but had no `onClick` at all.
It now opens a file picker, uploads to `/uploads/avatar`, and updates the
user's avatar immediately (with a real `<img>` shown in place of the
initials placeholder once one exists).

### Inspection photos — implemented from scratch
The `Inspection.images` field existed in the schema but the form always
submitted `images: []`; there was no capture UI. Added a photo picker to
the inspection form (uploads to `/uploads`, folder: `inspections`) and
thumbnail previews on both the form and the saved inspection cards.

### Site Diary — built (Module 8 was entirely missing)
There was no frontend for this at all, and the backend route would have
thrown on every create (see the ownership bug above). Added a full
`SiteDiaryPage`: project picker, date/weather/temperature, labour &
equipment counts, materials used, work description, multi-photo upload,
and a "Generate Report" button that exports all logged days as CSV.
Wired into the sidebar and router.

### Removed dead code
The old generic `/files` CRUD route (`createCrudRoutes('files', ...)`) is
gone — it never worked (see the ownership bug above) and is fully
superseded by `/uploads`.

## Setup — updated

```bash
# Backend
cd backend
npm install
npx prisma db push --schema=../database/schema.prisma   # applies the new otp* columns
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

Add to `.env` (see `.env.example` for the full list):

```
# Pick ONE, or configure both for automatic failover — Resend is tried first.
RESEND_API_KEY="re_xxx"
RESEND_FROM_EMAIL="onboarding@resend.dev"

SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="you@gmail.com"
SMTP_PASS="app-password"
EMAIL_FROM="noreply@yourdomain.com"
```

If neither is set, OTP codes are printed to the backend console in
development so the flow is still testable end-to-end without any email
provider.

For file uploads (Drawings, Inspection photos, Site Diary photos, profile
pictures), set the Cloudinary credentials in `.env`:

```
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

These are free to get from https://cloudinary.com. Without them, any
upload attempt returns a clear 503 error rather than failing silently.

After pulling these changes, re-run `npx prisma db push` — the schema
picked up `userId` on BOQ/Estimation and `category`/`notes`/`rateItems` on
ProjectFile.
