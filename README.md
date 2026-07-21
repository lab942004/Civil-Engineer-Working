# 🏗️ Civil Engineering Assistant

**Version 1.0.0**

> "Everything a Civil Engineer Needs in One Platform"

## 📋 Overview

A comprehensive, production-ready web application for civil engineers. This platform provides engineering calculators, unit converters, material library, IS codes, BOQ generation, rate analysis, estimation, project management, site inspection tools, site diary, admin panel, and much more.

### Related Documents
- **[CHANGES.md](./CHANGES.md)** — Full audit log of bugs found and fixed, plus all feature additions (OTP verification, Cloudinary uploads, Site Diary, etc.)
- **[VERIFICATION_SIGNOFF.md](./VERIFICATION_SIGNOFF.md)** — Independent verification & sign-off requirements for pre-production audit

---

## 🚀 Tech Stack

### Frontend (User App)
- **React 19** with **TypeScript**
- **Vite** for build tooling
- **Tailwind CSS v4** for styling
- **Shadcn UI** (Radix UI primitives) components
- **Framer Motion** for animations
- **React Router v7** for routing
- **React Hook Form** + **Zod** for forms/validation
- **Axios** + **TanStack Query** for API/data fetching
- **Zustand** for state management
- **Lucide React** for icons
- **Recharts** for charts/graphs
- **react-hot-toast** for notifications

### Admin Panel
- **React 19** + **TypeScript** + **Vite**
- **Tailwind CSS v4** styling
- **Lucide React** icons
- **Recharts** for analytics dashboards
- Dedicated auth context, route guards, and layouts

### Backend
- **Node.js** + **Express.js** with **TypeScript**
- **Prisma ORM** for database
- **PostgreSQL** database
- **JWT** authentication with access + refresh tokens
- **bcryptjs** for password hashing
- **Cloudinary** for file/image storage
- **Resend** (primary) + **Nodemailer** (SMTP fallback) for email
- **Helmet** + **express-rate-limit** for security
- **Multer** for file upload handling
- **Morgan** for HTTP request logging

---

## 📁 Project Structure

```
Civil-Engineer-Working/
├── admin/                       # React + TypeScript admin panel
│   ├── src/
│   │   ├── components/          # Shared admin components (FileUpload, etc.)
│   │   ├── context/             # AuthContext for admin login
│   │   ├── hooks/               # Custom React hooks
│   │   ├── layouts/             # AdminLayout, Sidebar
│   │   ├── lib/                 # Utility functions (utils.ts)
│   │   ├── pages/
│   │   │   ├── Login/           # Admin login
│   │   │   ├── Dashboard/       # Admin dashboard
│   │   │   ├── Users/           # User management
│   │   │   ├── Categories/      # Category management
│   │   │   ├── Notifications/   # Push notifications
│   │   │   ├── Analytics/       # Platform analytics
│   │   │   ├── Reports/         # Report management
│   │   │   ├── Settings/        # System settings
│   │   │   ├── Profile/         # Admin profile
│   │   │   ├── Downloads/       # Download management
│   │   │   ├── ActivityLogs/    # Activity logs
│   │   │   ├── LearningCenter/  # Learning content management
│   │   │   ├── ISCodes/         # IS codes management
│   │   │   └── MaterialLibrary/ # Material library management
│   │   ├── routes/              # App routes with guards
│   │   └── services/            # API service layer (api.ts)
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
│
├── frontend/                    # React + TypeScript user frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/              # Reusable UI components (Shadcn)
│   │   │   ├── layout/          # Layout components (Sidebar, Topbar)
│   │   │   ├── shared/          # Shared components (EngineeringDisclaimer)
│   │   │   └── common/          # Common components
│   │   ├── pages/
│   │   │   ├── auth/            # Login, Register, Forgot/Reset Password, Verify Email
│   │   │   ├── dashboard/       # Main dashboard
│   │   │   ├── calculator/      # Engineering calculators
│   │   │   ├── converter/       # Unit converter
│   │   │   ├── materials/       # Material library
│   │   │   ├── iscodes/         # IS codes library
│   │   │   ├── boq/             # BOQ generator
│   │   │   ├── rate-analysis/   # Rate analysis
│   │   │   ├── estimation/      # Estimation module
│   │   │   ├── drawings/        # Drawing library (Cloudinary-backed)
│   │   │   ├── projects/        # Project management
│   │   │   ├── inspection/      # Site inspection with photos
│   │   │   ├── site-diary/      # Site diary / daily progress
│   │   │   ├── reports/         # Reports
│   │   │   ├── notes/           # Notes
│   │   │   ├── learning/        # Learning center
│   │   │   ├── profile/         # User profile with avatar upload
│   │   │   ├── admin/           # User-facing admin links
│   │   │   ├── SettingsPage.tsx
│   │   │   ├── HelpPage.tsx
│   │   │   └── NotFoundPage.tsx
│   │   ├── hooks/               # Custom React hooks
│   │   ├── lib/                 # Utility functions
│   │   ├── services/            # API service layer
│   │   ├── store/               # Zustand stores
│   │   ├── types/               # TypeScript types
│   │   └── utils/               # Engineering calculations
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
│
├── backend/                     # Express + TypeScript backend
│   ├── src/
│   │   ├── index.ts             # Server entry point
│   │   ├── config/              # Configuration (env, cloudinary, etc.)
│   │   ├── controllers/         # Route controllers
│   │   ├── lib/                 # Shared utilities (prisma singleton)
│   │   ├── middleware/          # Auth, upload, error handler, admin auth
│   │   ├── routes/              # API routes (index, admin, upload, auth)
│   │   ├── services/            # Business logic (auth, email, upload, crud)
│   │   ├── types/               # TypeScript types
│   │   └── utils/               # Helper functions
│   ├── tsconfig.json
│   └── package.json
│
├── database/
│   └── schema.prisma            # Prisma schema (34 relations, 30+ tables)
│
├── .env.example                 # Environment variables template
├── CHANGES.md                   # Audit & fix log
├── VERIFICATION_SIGNOFF.md      # Pre-production audit sign-off
└── README.md
```

---

## 🗄️ Database Tables (30+)

| Module | Tables |
|--------|--------|
| **Auth & Users** | User (with OTP fields), Role, Permission |
| **Projects** | Project, ProjectMember, ProjectFile |
| **Calculations** | CalculatorCategory, Calculator, CalculatorInput, SavedCalculation |
| **Materials** | Material, MaterialProperty, Specification |
| **IS Codes** | ISCode |
| **BOQ** | BOQ, BOQItem (userId-scoped) |
| **Estimation** | Estimation, EstimationBreakdown (userId-scoped) |
| **Inspection** | Inspection, InspectionItem (with photo support) |
| **Site Diary** | DailyProgress (createdById-scoped) |
| **Notes** | Note |
| **Reports** | Report |
| **Notifications** | Notification |
| **Activity** | ActivityLog, RecentActivity |
| **User Data** | Settings, Bookmark, Download, Favorite |
| **Feedback** | Feedback, SupportTicket |
| **Utilities** | UnitConversion, SurveyData |

---

## 🧮 Engineering Calculators (14+)

All calculations use **pure mathematical formulas** based on **IS Codes**:

1. **Concrete Mix Design** (IS 10262 — note: IS 456 governs durability *requirements*, IS 10262 governs proportioning)
2. **Steel Weight Calculator** (W = D²/162, IS 1786)
3. **Slab Design** (IS 456:2000, Cl 23.2.1)
4. **Beam Design** (IS 456:2000, Cl 26.5.1.1, Cl 38, Annex G)
5. **Column Design** (IS 456:2000, Cl 39.3)
6. **Foundation Design** (IS 456:2000, Cl 34.2.4.1)
7. **Earthwork Calculation**
8. **Brick Calculation** (IS 2212)
9. **Water Tank Design**
10. **Road Quantity** (MORTH)
11. **Pipe Flow** (Hazen-Williams)
12. **Load Calculation** (IS 875)
13. **Slope Calculation**
14. **Cement & Mortar**

Each calculator provides:
- ✅ Input form with validation
- ✅ Formula display with IS code references
- ✅ Step-by-step solution
- ✅ Result with units
- ✅ Detailed breakdown
- ✅ PDF export, Print, Share, Save
- ✅ Engineering disclaimer ("For guidance only — verify with a licensed structural/civil engineer")

> ⚠️ **Important:** All structural calculators have undergone an audit and bug-fix pass. See [CHANGES.md](./CHANGES.md) for details on fixed bugs (beam minimum steel, foundation depth unit error, column safety check). See [VERIFICATION_SIGNOFF.md](./VERIFICATION_SIGNOFF.md) for independent verification requirements before using outputs for real construction decisions.

---

## 🔧 Modules

| # | Module | Description |
|---|--------|-------------|
| 1 | **Engineering Calculator** | 14+ structural/quantity calculators with IS code citations |
| 2 | **Unit Converter** | 10 categories, 50+ units |
| 3 | **Material Library** | 13 material categories |
| 4 | **IS Codes Library** | Browse/search Indian Standards |
| 5 | **BOQ Generator** | Bill of Quantities with CSV export |
| 6 | **Rate Analysis** | Material + labour + equipment costs |
| 7 | **Estimation Module** | Building cost estimation |
| 8 | **Drawing Library** | Upload/manage drawings (Cloudinary-backed) |
| 9 | **Project Management** | Track projects and members |
| 10 | **Site Inspection** | Checklists with photo capture |
| 11 | **Site Diary** | Daily progress with labour, equipment, weather, photos, CSV export |
| 12 | **Notes** | Rich text engineering notes |
| 13 | **Report Generator** | Report management |
| 14 | **Learning Center** | Articles, tutorials, MCQs |
| 15 | **Profile** | User profile with avatar upload and certifications |
| 16 | **Admin Panel** | Full admin interface (separate app) |

---

## 👥 User Roles

- **Super Admin** — Full system access
- **Admin** — Administrative access
- **Civil Engineer** — Full engineering tools
- **Site Engineer** — Site management tools
- **Structural Engineer** — Structural design tools
- **Student** — Learning resources
- **Contractor** — Project & BOQ tools
- **Client** — Project viewing
- **Guest** — Limited access

---

## 🔐 Security & Authentication

- **OTP Email Verification** — 6-digit code via Resend (primary) with SMTP fallback; 10-min expiry, max 5 attempts, 60s resend cooldown
- **Helmet.js** for HTTP security headers
- **Rate limiting** on API routes (login, register, OTP, and general)
- **JWT** with access tokens (7-day) + refresh tokens (30-day, verified)
- **bcryptjs** password hashing (cost factor 12)
- **Input validation** via Zod (client-side)
- **CORS** configuration with whitelisted frontend URLs
- **SQL injection protection** via Prisma ORM
- **XSS protection**
- **IDOR protection** — all user-scoped resources check ownership (userId, createdById, uploadedById)
- **Environment variables** for all secrets
- **File upload whitelist** — images, PDF, Office docs, CAD formats (DWG/DXF/DGN); 20 MB limit

---

## 🚦 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

```bash
# 1. Clone the repository
git clone <repo-url>
cd Civil-Engineer-Working

# 2. Install backend dependencies
cd backend
npm install

# 3. Set up environment variables
cp ../.env.example .env
# Edit .env with your database URL, JWT secrets, Cloudinary keys, etc.

# 4. Generate Prisma client
npm run prisma:generate

# 5. Push database schema
npm run prisma:push

# 6. Install frontend dependencies (in a new terminal)
cd ../frontend
npm install

# 7. Install admin panel dependencies
cd ../admin
npm install

# 8. Start development servers
# Terminal 1 - Backend (from backend/)
npm run dev

# Terminal 2 - Frontend (from frontend/)
npm run dev

# Terminal 3 - Admin Panel (from admin/)
npm run dev
```

### Access
| App | URL |
|-----|-----|
| **Frontend (User)** | http://localhost:5173 |
| **Admin Panel** | http://localhost:5174 |
| **Backend API** | http://localhost:5000/api/v1 |
| **Health Check** | http://localhost:5000/api/v1/health |

---

## 📡 API Endpoints

All endpoints are prefixed with `/api/v1/`

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | User registration (sends OTP) |
| POST | `/auth/login` | User login (checks email verified) |
| POST | `/auth/verify-otp` | Verify email with 6-digit OTP (auto-login) |
| POST | `/auth/resend-otp` | Resend OTP (60s cooldown) |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/forgot-password` | Forgot password (emails reset link) |
| POST | `/auth/reset-password` | Reset password |

### User
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/me` | Get current user |
| PUT | `/users/me` | Update profile |

### Data & Resources
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/projects` | List projects |
| POST | `/projects` | Create project |
| GET | `/calculators` | List calculators |
| POST | `/calculators/calculate` | Run calculation |
| GET | `/materials` | List materials |
| GET | `/iscodes` | List IS codes |
| GET | `/boq` | List BOQs |
| POST | `/boq` | Create BOQ |
| GET | `/estimations` | List estimations |
| POST | `/estimations` | Create estimation |
| GET | `/inspections` | List inspections |
| GET | `/reports` | List reports |
| GET | `/notes` | List notes |
| GET | `/notifications` | List notifications |

### Uploads (Cloudinary-backed)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/uploads` | Upload file (generic) |
| POST | `/uploads/avatar` | Upload profile picture |
| GET | `/uploads` | List user's uploads |
| PUT | `/uploads/:id` | Update upload metadata |
| DELETE | `/uploads/:id` | Delete upload (Cloudinary + DB) |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/users` | List all users |
| GET | `/admin/analytics` | Platform analytics |
| (and more) | | Full CRUD for admin panel |

---

## ☁️ Cloudinary Storage Structure

```
civil-engineer/
├── users/          # Profile images
├── projects/       # Project documents
├── reports/        # Generated PDFs
├── drawings/       # Engineering drawings
├── calculations/   # Calculation exports
├── inspections/    # Inspection photos
├── site-diary/     # Site diary photos
├── materials/      # Material images/catalogs
├── certificates/   # User certificates
└── pdfs/           # General PDFs
```

---

## 📧 Email Providers

The app supports two email providers with automatic failover:

1. **Resend** (primary) — Tried first; set `RESEND_API_KEY` in `.env`
2. **SMTP via Nodemailer** (fallback) — Used if Resend is not configured or fails; configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`

If neither is configured, OTP codes and password reset links are logged to the backend console in development mode.

---

## 📊 Build Output

### Frontend Build
```
✓ 564 modules transformed
dist/index.html                   0.90 kB
dist/assets/index.css            35.62 kB
dist/assets/index.js            671.28 kB
```

---

## ⚠️ Important Notes

### Engineering Accuracy
All structural calculators have been audited for bugs. Three critical bugs were found and fixed:
- Beam minimum steel formula (was 100× too large)
- Foundation depth unit error (was ~1000× too large)
- Column safety check unit inconsistency (safety flag was unreliable)

See [CHANGES.md](./CHANGES.md) for full details and [VERIFICATION_SIGNOFF.md](./VERIFICATION_SIGNOFF.md) for pre-production verification requirements.

### Pre-Production Checklist
Before using this application for any real construction, financial, or safety decision:
1. Run each structural calculator against a known IS SP:16 or textbook worked example
2. Configure strong `JWT_SECRET` and `JWT_REFRESH_SECRET` environment variables (the code has a hardcoded fallback for development)
3. Add server-side input validation (express-validator is installed but currently unused)
4. Ensure HTTPS is enforced at the reverse proxy/load balancer level
5. Consider adding malware/content scanning to file uploads

---

## 📝 License

MIT License — See LICENSE file for details

---

**Built with ❤️ for Civil Engineers**