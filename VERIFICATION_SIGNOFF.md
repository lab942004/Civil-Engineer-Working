# Independent Verification & Sign-Off Requirements
**Civil Engineer Assistant — Pre-Production Audit**
Prepared as a standalone document per audit requirement #7. Do not treat this app's output as construction-ready until every item below has been independently verified by the named category of professional.

This document reports what was actually found in the codebase by direct inspection — not assumptions, not the original spec's claims. Where something could not be verified without a professional, running device, or live traffic, that is stated explicitly rather than assumed to pass.

---

## 1. ENGINEERING ACCURACY

**Scope actually implemented:** 4 structural design calculators (Slab, Beam, Column, Foundation) plus ~15 quantity/material calculators, all in `frontend/src/utils/calculations.ts`. The original spec describes 100+ calculators; only this subset exists in code. Everything below applies to *this* subset only — anything not listed here has not been built, so there is nothing to audit yet.

### Bugs found and fixed during this audit
These were silently producing wrong answers before today. Fix details are also in `CHANGES.md`.

| # | Location | Bug | Impact |
|---|----------|-----|--------|
| 1 | `calculateBeam` | Minimum tension steel formula had a stray `× 100`: `(0.85/fy)×b×d×100` instead of `(0.85/fy)×b×d` (IS 456 Cl 26.5.1.1) | Minimum steel was inflated ~100×, so `Math.max(calculated, minimum)` picked the wrong (100× too large) value for almost every input. **Every beam design result before this fix should be considered wrong.** |
| 2 | `calculateFoundation` | Footing projection was used in millimetres inside a formula expecting metres, squared against a kN/m² pressure term | Required footing depth came out ~1000× too large (verified example: 1000 kN column load produced a ~203 **metre** required depth instead of ~203 mm). **Every footing design result before this fix should be considered wrong.** |
| 3 | `calculateColumn` | The `isSafe` (SAFE/OVERLOADED) check compared axial capacity in **Newtons** directly against factored load in **kN**, with no unit conversion | Capacity-in-N is ~1000× larger than load-in-kN for any realistic column, so the OVERLOADED warning could essentially never fire even for a genuinely unsafe column. **The safety flag was not trustworthy before this fix.** |

All three are now fixed and unit-consistent. **However: these three bugs existed in a shipped structural-design tool with no test suite catching them.** That is the strongest possible argument for requirement #7 — nothing here should be trusted without independent recalculation.

### Code/standard citations — as they exist in code today
| Calculator | Code cited in app | Clause-level citation? | Notes |
|---|---|---|---|
| Slab Design | "IS 456:2000" | No — now cites Cl 23.2.1 for span/depth only, after this audit's fix | Flexure design uses Cl 23.2.1 (span/depth) and the standard Ast formula; minimum steel matches Cl 26.5.2.1 (0.12% for HYSD bars). Deflection is **not actually checked** — only estimated via the basic span/depth ratio, which IS 456 treats as a preliminary check, not a substitute for the full deflection calculation in Annex C. |
| Beam Design | "IS 456:2000" | Partially — Cl 26.5.1.1 now cited for min. steel, after this audit's fix | Flexure (Cl 38) and Mu,lim (Annex G) formulas are structurally correct. **No shear design at all** — shear force is calculated and displayed, but no stirrup/shear reinforcement design against Cl 40 is performed, and no warning says so. |
| Column Design | "IS 456:2000" | No — now cites Cl 39.3, and Cl 39.7/39.8 in a new warning, after this audit's fix | Cl 39.3 short-column axial formula is correct. Reinforcement is **hard-assumed at 1% of gross area** rather than calculated from the actual load — this is a trial/estimate, not a design. Slender-column additional moment (Cl 39.7) is not calculated at all; a warning now says so but the number is still not usable for slender columns. |
| Foundation Design | "IS 456:2000" | No — now cites Cl 34.2.4.1 for flexure, and Cl 31.6 in a new warning | Flexural depth check only. **No one-way (beam) shear or two-way (punching) shear check** — for footings, punching shear very often governs required depth, sometimes producing a larger depth than flexure does. A warning now discloses this; the depth number itself is still flexure-only. |
| Concrete Mix Design | Labeled "IS 456:2000" in the app | **Incorrect citation** | Concrete mix proportioning is governed by **IS 10262** ("Concrete Mix Proportioning — Guidelines"), not IS 456. IS 456 covers grade/durability *requirements*, not the proportioning procedure used in this calculator. The water-content and aggregate-fraction constants used (186 kg/m³ base water, 0.35/0.38 fine-aggregate fraction) are typical IS 10262 Table values but are hard-coded for one aggregate/slump condition, not derived per the code's own correction tables. |
| Steel Weight | Unlabeled | N/A | Formula `W = D²/162` is the standard, correct unit-weight relation (derives from steel density via IS 1786). No issue found. |
| All other calculators (Brick/Block/Mortar/Tile/Paint/Plaster/Earthwork/etc.) | Not IS-Code cited | — | These are simple geometric/material-quantity formulas, not code-governed structural checks. Not independently re-derived line-by-line in this pass — recommend the same scrutiny applied to the 5 above before relying on them for procurement quantities.

### Units
Spot-checked every function above field-by-field. All inputs/outputs now carry a labelled unit in the UI (mm, m, kN, kN·m, N/mm², kg, kg/m³). The two unit-consistency bugs found (foundation depth, column safety check) are fixed above; **the rest of the codebase's ~15 other calculators were not individually re-derived unit-by-unit in this pass** and should be spot-checked the same way before relying on them.

### Worked examples against a known textbook answer
**Not done.** No calculator in this codebase has an automated or manual worked-example test comparing its output to a published textbook/IS SP:16 design-aid answer. This is the single most important gap in this category — it is the only way to catch the class of bug found above *before* shipping, rather than by manual code review after the fact. Recommend: before production use, run at least one standard SP:16 or textbook example through each of the 4 structural calculators and confirm the match, then keep that as a permanent regression test.

### Assumptions requiring independent verification (per calculator)
- **Slab:** simply-supported one-way action assumed; span/depth ratio of 12 (basic, unmodified by tension-steel percentage per Cl 23.2.1(e)); Fe500/M25 default if not specified.
- **Beam:** singly-reinforced assumed unless Mu > Mu,lim (doubly-reinforced case is *detected* but not designed); self-weight assumed at 25 kN/m³ density; no torsion check.
- **Column:** short-column formula applied regardless of actual slenderness in the returned capacity number (a warning is shown for slender columns, but the number itself doesn't change); 1% steel is a flat assumption, not calculated; no biaxial bending check.
- **Foundation:** isolated pad footing, concentric axial load only (no moment transfer from column checked); soil bearing capacity is a raw user input, not derived from any geotechnical calculation; no check against minimum cover, edge distance, or reinforcement distribution requirements (Cl 34.3).
- **Concrete mix:** fixed standard deviation (4 N/mm² for M25) regardless of actual site quality control grade (IS 10262 varies this by QC level); one fixed aggregate correction, not adjusted for actual site aggregate grading.

### Safety warning logic — exact trigger conditions (as of this audit)
| Warning | Trigger | Calculator |
|---|---|---|
| "OVERLOADED" | `axialCapacity(kN) < factoredLoad(kN)` (fixed this audit — see bug #3 above) | Column |
| Slender column warning | `slendernessRatio > 12` | Column |
| Doubly-reinforced warning | `Mu > Mu,lim` (Cl 38 limiting moment) | Beam |
| Deflection-not-checked disclosure | Always shown | Slab |
| Shear-not-checked disclosure | Always shown | Foundation |
| **No warning exists** | Beam shear capacity is never checked against demand at all — not even a disclosure was present before this audit; one now exists in the design comments but there is still no computed shear check | Beam |

### Disclaimer
**Added during this audit.** A "For guidance only — verify with a licensed structural/civil engineer" banner (`components/shared/EngineeringDisclaimer.tsx`) is now shown on: the Calculator page for Slab/Beam/Column/Foundation results, the BOQ page, and the Estimation page. It was **not present anywhere in the app before this audit** — confirmed by a full-text search of the frontend that returned zero matches for any disclaimer language prior to today's change.

---

## 2. INPUT VALIDATION

| Check | Status | Evidence |
|---|---|---|
| Client-side validation | ✅ Partial | React Hook Form + basic HTML5 `type="number"` on most forms. Not applied uniformly to every input across all ~30 pages — not individually re-verified field-by-field in this pass. |
| **Server-side validation** | ❌ **Effectively absent** | `express-validator` is listed in `package.json` but **has zero usages anywhere in the backend** (`grep -rln "express-validator" backend/src` returns nothing). No controller checks that `quantity > 0`, that `email` is a valid format, that numeric fields aren't `NaN`, etc. Whatever a client sends — including a hand-crafted request bypassing the UI entirely — goes essentially straight into a Prisma query. |
| Zero/negative/blank/non-numeric/extreme values | ❌ Not handled | Confirmed by code inspection: e.g. `calculateSteelWeight` with `diameter=0` silently returns `weightPerMeter=0` and propagates a `0` result with no error. No calculator or CRUD endpoint rejects negative quantities, negative prices, or absurd values (e.g. a footing load of -500 kN, or a BOQ item quantity of 10,000,000). |
| File upload type/size restriction | ✅ Now enforced (added this session) | `middleware/upload.ts`: 20 MB limit, one file per request, extension whitelist (images, PDF, Office docs, DWG/DXF/DGN). |
| File **content scanning** (malware/virus) | ❌ **Not implemented** | No antivirus/content-scanning step exists. Files are streamed directly from Multer's memory buffer to Cloudinary with no scan in between. An extension whitelist is not a substitute for content scanning — a malicious payload can be given an allowed extension. Recommend integrating a scanning step (e.g. ClamAV, or a cloud scanning API) before this goes to production, especially since uploads are shared across a team. |
| Silent 0/null propagation | ❌ Confirmed present | See above — this is the general failure mode across the app: invalid numeric input becomes `0` or `NaN` and flows into downstream calculations/totals without any rejection or warning banner. |

**Bottom line for this category: input validation is a real, unaddressed gap.** The app currently trusts the client completely for anything beyond "is this JSON." This should be treated as a blocking item before production use, not a nice-to-have — combined with the missing server-side validation, a malicious or simply mistaken API caller can insert nonsensical or harmful data (negative costs, absurd quantities, empty required fields) directly into the database, bypassing every UI-level guard.

---

## 3. AUTHENTICATION & SECURITY

| Check | Status | Evidence |
|---|---|---|
| Password hashing algorithm | ✅ bcrypt | `bcryptjs`, cost factor 12 for passwords (`backend/src/utils/helpers.ts`). Not reversible encryption — correct approach. |
| JWT expiry | ✅ Configured | Access token: 7 days. Refresh token: 30 days (`backend/src/config/index.ts`). |
| Refresh token flow / expired-token behavior | ✅ Fixed this session, now correct | Previously `refreshTokens()` only checked whether the token string existed in the DB — it never called `jwt.verify()`, so an *expired* refresh token (by its own `exp` claim) still worked as long as the DB row wasn't cleared, meaning refresh tokens never actually expired in practice. Now verified against `JWT_REFRESH_SECRET` first; an expired or tampered token is rejected with 401 before the DB is even queried. **Recommend an actual test**: issue a token, manually set its `exp` to the past (or wait out a short-lived test config), call `/auth/refresh`, and confirm a 401. This was verified by code logic, not by running a live expiry test in this session. |
| **7-day access token lifetime** | ⚠️ Hardening recommendation | 7 days is long for an *access* token (industry norm is minutes-to-hours, with the refresh token carrying the longer session). There's no server-side access-token revocation list, so a stolen access token remains valid for up to 7 days with no way to kill it early short of rotating `JWT_SECRET` (which would log out everyone). Recommend shortening to 15–60 minutes now that refresh-token rotation actually works correctly. |
| **Hardcoded fallback JWT secret** | ❌ **Real vulnerability** | `config/index.ts`: `secret: process.env.JWT_SECRET \|\| 'super-secret-key-change-in-production'`. If `JWT_SECRET` is not set in the deployment environment, the app silently falls back to a secret that is committed in plaintext in this repository. Anyone who has seen this codebase (which now includes an AI assistant, incidentally) could forge valid tokens for any user against a deployment that forgot to set the env var. **This must be fixed before production**: the app should refuse to start if `JWT_SECRET`/`JWT_REFRESH_SECRET` aren't set, not silently fall back to a known value. |
| Rate limiting on login/signup | ✅ Present | `authRoutes.ts`: dedicated limiters exist for login and register, in addition to the OTP-specific limiters added this session. (Exact thresholds are defined in that file — confirm they match your expected traffic/abuse tolerance before launch, e.g. tune down if you see credential-stuffing attempts.) |
| IDOR protection | ✅ Fixed this session | The generic CRUD controller (`crudController.ts`) now checks `existing[ownerField] === req.user.id` before returning/updating/deleting any user-scoped resource (Projects, BOQs, Estimations, Inspections, Notes, Site Diary entries, uploaded files, etc.), and rejects with 403 otherwise. Before this session, **BOQ and Estimation had no owner field at all** — every user could see every other user's BOQs and cost estimates by simply guessing/incrementing an ID. This was found and fixed as part of this engagement, not something that was already safe. |
| HTTPS enforcement | ⚠️ Partial | `helmet()` is applied (sets security headers, including HSTS *when served over HTTPS*). **The Express app itself does not redirect HTTP→HTTPS** — that's normally the job of the reverse proxy/load balancer (e.g. Nginx, a cloud load balancer, or the PaaS platform) in front of it, not the Node app. Confirm your deployment's edge/proxy layer terminates TLS and redirects all HTTP traffic — this cannot be confirmed from the app code alone. |

---

## 4. DATABASE & BUSINESS LOGIC

| Check | Status | Evidence |
|---|---|---|
| Foreign key constraints / cascade rules | ✅ Present throughout | 34 relations in `schema.prisma`, all with an explicit `onDelete` rule (mostly `Cascade`). Example: deleting a `Project` cascades to its BOQs, Estimations, Inspections, Daily Progress entries, and Files (all declared `onDelete: Cascade` on the child's `project` relation) — confirm this destructive-cascade behavior is actually what you want operationally (deleting a project silently deletes all its cost/quantity records with no soft-delete or archive step). Recommend considering a soft-delete (`deletedAt` flag) for Projects specifically, given how much cascades from it. |
| Attendance salary logic | ⚠️ **Cannot confirm — not found in codebase** | Searched for an Attendance model/controller with salary calculation logic; **Module 9 (Attendance) from the original spec was never built** — there is no Attendance table, no check-in/check-out logic, no salary computation anywhere in this codebase. There is nothing to cross-check yet. |
| Cost/GST totals | ✅ Manually cross-checked | BOQ page: `grandTotal = itemsTotal + transportCost + gstAmount + overheadAmount + contingencyAmount`, where `gstAmount = itemsTotal × gstPercent/100`. Verified this arithmetic against a manual calculation with sample numbers (₹100,000 items, 18% GST → ₹18,000 GST, matches). Totals are derived reactively on every render (not a stale cached value), so they can't drift from the on-screen line items. |
| Low-stock alert thresholds | ⚠️ **Cannot confirm — not found in codebase** | Module 10 (Material Management / Inventory) describes a "Low Stock Alert" feature; no Inventory/Stock model, threshold field, or alert logic exists in the current schema or backend. Nothing to cross-check. |
| Concurrent-edit / race-condition handling | ❌ **Not handled** | No model has a `version` field or any optimistic-concurrency check. Every `update()` call is a last-write-wins overwrite — if two users edit the same BOQ at the same time, whichever save lands last silently overwrites the other's changes with no conflict warning to either user. This is a real gap for any multi-user/team scenario (which is explicitly a goal of this app per the original spec's "Project Management" and "Team" framing). Recommend adding a `version` integer or `updatedAt`-based check on at least BOQ, Estimation, and Project before/if this is used by more than one person per project. |

---

## 5. REPORTS & EXPORTS

| Check | Status | Evidence |
|---|---|---|
| PDF export matches on-screen data | ❌ **Not real PDF generation** | `ReportsPage.tsx`'s "Export PDF" button creates a plain `.txt` file (`Blob([...], {type: 'text/plain'})` saved with a `.pdf`-suggesting name) containing only the free-text `content` field of a generic "Report" entity — it does not export BOQ line items, calculator results, or inspection data as a real PDF. **No PDF-generation library is used anywhere in the frontend.** If real PDF export of BOQs/calculations/inspections is required, this needs to be built — it currently does not exist despite being named in the original spec for every module ("Export PDF"). |
| CSV export matches on-screen data | ✅ Present for BOQ; ✅ new for Site Diary | BOQ's CSV export (`exportCSV`) walks the same `items` array rendered on screen, so it can't drift from what's displayed. Site Diary's new "Generate Report" does the same against the same `entries` list. Not implemented for every module (e.g. no CSV export on Calculator, Inspection, Projects). |
| Excel export | ❌ **Not implemented anywhere** | No `.xlsx` generation exists in the codebase (no `xlsx`/`exceljs` library used) despite being named in the spec ("Generate PDF Excel CSV"). |
| Export tested with 100+ records | ❌ **Not tested — and cannot be, by an AI code reviewer, without a live dataset and a person to visually confirm the output.** The CSV export code itself has no row limit and should mechanically handle large arrays, but "confirm it works correctly with 100+ records" requires actually generating a 100+ item BOQ and opening the resulting file — that's a manual QA step for your team, not something verifiable by reading source code. Recommend doing this explicitly before sign-off. |

---

## 6. PERFORMANCE & OFFLINE MODE

| Check | Status | Evidence |
|---|---|---|
| Offline data sync | ❌ **Not implemented at all** | No service worker, no `manifest.json`, no Workbox, no `navigator.onLine` handling, no offline queue anywhere in the frontend (confirmed by full-text search returning zero results). The original spec lists "Offline Mode" and "Background Sync" as requirements; neither exists. There is therefore no duplicate/conflict risk from offline sync **because there is no offline sync to test** — this entire feature needs to be built before it can be verified. |
| Behavior under throttled/poor network | ⚠️ **Not tested in this session** | This requires running the actual app under Chrome DevTools network throttling (or a real poor-network device) and observing behavior — not something verifiable by reading source code alone. What *can* be said from the code: most data fetching goes through react-query, which has built-in retry/loading-state handling, so the app should show loading spinners rather than blank screens on slow networks — but this has not been empirically confirmed against a throttled connection in this session. |
| Memory usage on low-end device | ❌ **Not tested — cannot be tested by this tool.** | This requires a physical low-end device or a properly configured low-end device emulation profile (CPU throttling + memory ceiling), running the app, and profiling it. This is outside what a code-reading review can confirm. Flagging as an open item for your QA process, not something this audit can close out. |

---

## 7. FINAL SIGN-OFF — MASTER VERIFICATION CHECKLIST

Everything in this list must be independently verified by the stated professional before this app is used for any real construction, financial, or safety decision. This is intentionally exhaustive rather than reassuring.

### Requires a licensed Structural/Civil Engineer
- [ ] Slab Design: span/depth-ratio-based depth, minimum steel, and the *absence* of a real deflection check (Annex C) and two-way action check
- [ ] Beam Design: flexure formula and (now-fixed) minimum steel calculation; the complete *absence* of shear design (Cl 40) and torsion check
- [ ] Column Design: short-column axial capacity formula; the 1%-steel assumption (not a real design); the *absence* of slenderness-moment design (Cl 39.7/39.8) for any column flagged "slender"; the *absence* of biaxial bending check
- [ ] Foundation Design: flexural depth formula (now unit-bug-fixed); the *absence* of one-way and punching shear checks (Cl 31.6, 34.2.4), which frequently govern real footing depth
- [ ] Concrete Mix Design: the mislabeled code citation (uses IS 10262 logic but is labeled "IS 456"); hard-coded standard deviation and aggregate fractions not adjusted for actual site conditions/QC grade
- [ ] Every one of the ~15 non-structural quantity calculators (Brick, Block, Mortar, Tile, Paint, Plaster, Earthwork, Road Material, Aggregate, etc.) — not individually re-derived in this audit pass
- [ ] Any output used for tendering, procurement quantities, or as the basis of a drawing/BOQ submitted to a client or authority

### Requires a Security Engineer / DevOps sign-off
- [ ] Confirm `JWT_SECRET` and `JWT_REFRESH_SECRET` are set to strong, unique values in every real deployment (the code currently has a hardcoded fallback if they're missing — this must be hardened to fail-closed, not fail-open, before production)
- [ ] Confirm the reverse proxy/load balancer in front of the app terminates TLS and force-redirects HTTP→HTTPS (cannot be confirmed from application code)
- [ ] Add server-side input validation (currently effectively absent — `express-validator` is installed but unused) before accepting untrusted traffic in production
- [ ] Add malware/content scanning to the file-upload pipeline before allowing team-wide file sharing in production
- [ ] Decide on and implement optimistic-concurrency handling for multi-user editing of BOQs/Estimations/Projects (currently last-write-wins with no warning)
- [ ] Load-test the login/OTP rate limiters against your expected traffic and tune thresholds accordingly

### Requires product/QA sign-off (manual testing, not code review)
- [ ] Run each of the 4 structural calculators against a known SP:16 or textbook worked example and confirm the numeric match — this has not been done and is the highest-value test to run before trusting this tool at all
- [ ] Generate and open a 100+ item BOQ CSV export and visually confirm it matches the on-screen totals
- [ ] Test the app under throttled/poor network conditions
- [ ] Profile memory usage on an actual low-end Android device
- [ ] Decide whether real PDF/Excel export (currently a plain-text file mislabeled as PDF, and no Excel export at all) is required before launch, and build it if so
- [ ] Decide whether offline mode (currently entirely unbuilt) is required before launch, and build it if so
- [ ] Decide whether Attendance (Module 9) and Material/Inventory low-stock alerts (Module 10) — both entirely unbuilt — are required before launch

---

*This document reflects the state of the codebase as directly inspected during this session. It is not a substitute for a professional structural/security review, and should be re-generated any time the calculation code, auth flow, or upload pipeline changes.*
