# 🏗️ AI Civil Engineering Assistant

**Version 1.0.0 - Without AI**

> "Everything a Civil Engineer Needs in One Platform"

## 📋 Overview

A comprehensive, production-ready web application for civil engineers. This platform provides engineering calculators, unit converters, material library, IS codes, BOQ generation, rate analysis, estimation, project management, site inspection tools, and much more.

**Architecture is AI-ready** - Version 2 can integrate OpenAI, Gemini, Claude, DeepSeek, or local LLMs without changing the database structure.

## 🚀 Tech Stack

### Frontend
- **React.js** (Latest) with **TypeScript**
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Shadcn UI** components
- **Framer Motion** for animations
- **React Router** for routing
- **React Hook Form** + **Zod** for forms/validation
- **Axios** + **TanStack Query** for API/data
- **Zustand** for state management
- **Lucide React** for icons

### Backend
- **Node.js** + **Express.js** with **TypeScript**
- **Prisma ORM** for database
- **PostgreSQL** database
- **JWT** authentication with refresh tokens
- **bcrypt** for password hashing
- **Cloudinary** for file storage
- **Helmet** + **Rate Limiting** for security

## 📁 Project Structure

```
AI-Civil-Engineer/
├── frontend/                    # React + TypeScript frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/             # Reusable UI components
│   │   │   ├── layout/         # Layout components (Sidebar, Topbar)
│   │   │   └── common/         # Common components
│   │   ├── pages/
│   │   │   ├── auth/           # Login, Register, Forgot/Reset Password
│   │   │   ├── dashboard/      # Main dashboard
│   │   │   ├── calculator/     # Engineering calculators
│   │   │   ├── converter/      # Unit converter
│   │   │   ├── materials/      # Material library
│   │   │   ├── iscodes/        # IS codes library
│   │   │   ├── boq/            # BOQ generator
│   │   │   ├── rate-analysis/  # Rate analysis
│   │   │   ├── estimation/     # Estimation module
│   │   │   ├── drawings/       # Drawing library
│   │   │   ├── projects/       # Project management
│   │   │   ├── inspection/     # Site inspection
│   │   │   ├── reports/        # Reports
│   │   │   ├── notes/          # Notes
│   │   │   ├── learning/       # Learning center
│   │   │   ├── profile/        # User profile
│   │   │   ├── admin/          # Admin panel
│   │   │   ├── SettingsPage.tsx
│   │   │   ├── HelpPage.tsx
│   │   │   └── NotFoundPage.tsx
│   │   ├── hooks/              # Custom React hooks
│   │   ├── lib/                # Utility functions
│   │   ├── services/           # API service layer
│   │   ├── store/              # Zustand stores
│   │   ├── types/              # TypeScript types
│   │   └── utils/              # Engineering calculations
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
│
├── backend/                    # Express + TypeScript backend
│   ├── src/
│   │   └── index.ts           # Server entry point
│   ├── tsconfig.json
│   └── package.json
│
├── database/
│   └── schema.prisma          # Prisma schema (all tables)
│
├── docs/                      # Documentation
├── .env.example               # Environment variables template
└── README.md
```

## 🗄️ Database Tables (30+)

| Module | Tables |
|--------|--------|
| **Auth & Users** | User, Role, Permission |
| **Projects** | Project, ProjectMember, ProjectFile |
| **Calculations** | CalculatorCategory, Calculator, CalculatorInput, SavedCalculation |
| **Materials** | Material, MaterialProperty, Specification |
| **IS Codes** | ISCode |
| **BOQ** | BOQ, BOQItem |
| **Estimation** | Estimation, EstimationBreakdown |
| **Inspection** | Inspection, InspectionItem |
| **Daily Progress** | DailyProgress |
| **Notes** | Note |
| **Reports** | Report |
| **Notifications** | Notification |
| **Activity** | ActivityLog, RecentActivity |
| **User Data** | Settings, Bookmark, Download, Favorite |
| **Feedback** | Feedback, SupportTicket |
| **Utilities** | UnitConversion, SurveyData |

## 🧮 Engineering Calculators (14+)

All calculations use **pure mathematical formulas** based on **IS Codes** - NO AI:

1. **Concrete Mix Design** (IS 456:2000)
2. **Steel Weight Calculator** (W = D²/162)
3. **Slab Design** (IS 456:2000)
4. **Beam Design** (IS 456:2000)
5. **Column Design** (IS 456:2000)
6. **Foundation Design** (IS 456:2000)
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
- ✅ Formula display
- ✅ Step-by-step solution
- ✅ Result with units
- ✅ Detailed breakdown
- ✅ PDF export, Print, Share, Save

## 🔧 Modules

| # | Module | Description |
|---|--------|-------------|
| 1 | **Engineering Calculator** | 14+ structural/quantity calculators |
| 2 | **Unit Converter** | 10 categories, 50+ units |
| 3 | **Material Library** | 13 material categories |
| 4 | **IS Codes Library** | Browse/search Indian Standards |
| 5 | **BOQ Generator** | Bill of Quantities with export |
| 6 | **Rate Analysis** | Material + labor + equipment costs |
| 7 | **Estimation Module** | Building cost estimation |
| 8 | **Drawing Library** | Upload/manage drawings |
| 9 | **Project Management** | Track projects and members |
| 10 | **Site Inspection** | Checklists with images |
| 11 | **Daily Progress Report** | Labour, equipment, weather |
| 12 | **Notes** | Rich text engineering notes |
| 13 | **Report Generator** | PDF reports |
| 14 | **Learning Center** | Articles, tutorials, MCQs |
| 15 | **Profile** | User profile with certifications |
| 16 | **Admin Panel** | User management, analytics |

## 👥 User Roles

- **Super Admin** - Full system access
- **Admin** - Administrative access
- **Civil Engineer** - Full engineering tools
- **Site Engineer** - Site management tools
- **Structural Engineer** - Structural design tools
- **Student** - Learning resources
- **Contractor** - Project & BOQ tools
- **Client** - Project viewing
- **Guest** - Limited access

## 🔐 Security

- Helmet.js for HTTP headers
- Rate limiting on API routes
- JWT with access + refresh tokens
- bcrypt password hashing
- Input validation (Zod)
- CORS configuration
- SQL injection protection (Prisma)
- XSS protection
- Environment variables for secrets

## 🚦 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

```bash
# 1. Clone the repository
git clone <repo-url>
cd AI-Civil-Engineer

# 2. Install frontend dependencies
cd frontend
npm install

# 3. Install backend dependencies
cd ../backend
npm install

# 4. Set up environment variables
cp ../.env.example ../backend/.env
# Edit .env with your database URL, JWT secrets, Cloudinary keys

# 5. Generate Prisma client
npm run prisma:generate

# 6. Push database schema


# 7. Start development servers
# Terminal 1 - Backend
npm run dev

# Terminal 2 - Frontend
cd ../frontend
npm run dev
```

### Access
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api/v1
- **Health Check**: http://localhost:5000/api/v1/health

## 📡 API Endpoints

All endpoints are prefixed with `/api/v1/`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | User registration |
| POST | `/auth/login` | User login |
| POST | `/auth/refresh` | Refresh token |
| POST | `/auth/forgot-password` | Forgot password |
| POST | `/auth/reset-password` | Reset password |
| GET | `/users/me` | Get current user |
| PUT | `/users/me` | Update profile |
| GET | `/projects` | List projects |
| POST | `/projects` | Create project |
| GET | `/calculators` | List calculators |
| POST | `/calculators/calculate` | Run calculation |
| GET | `/materials` | List materials |
| GET | `/iscodes` | List IS codes |
| GET | `/boq` | List BOQs |
| POST | `/boq` | Create BOQ |
| GET | `/estimations` | List estimations |
| POST | `/files/upload` | Upload file |
| GET | `/inspections` | List inspections |
| GET | `/reports` | List reports |
| GET | `/notes` | List notes |
| GET | `/notifications` | List notifications |
| GET | `/admin/users` | Admin: list users |
| GET | `/admin/analytics` | Admin: analytics |

## ☁️ Cloudinary Structure

```
civil-engineer/
├── users/          # Profile images
├── projects/       # Project documents
├── reports/        # Generated PDFs
├── drawings/       # Engineering drawings
├── calculations/   # Calculation exports
├── inspection/     # Inspection photos
├── materials/      # Material images/catalogs
├── certificates/   # User certificates
└── pdfs/           # General PDFs
```

## 🤖 AI-Ready Architecture (Version 2)

The architecture is designed for easy AI integration:

- **Database**: All data is structured and normalized - AI models can query via API
- **Calculations**: Pure functions can be replaced/assisted by AI models
- **Reports**: Structured data ready for AI-generated summaries
- **Recommendations**: Material/project data structured for ML recommendations
- **Future AI Integration Points**:
  - `services/ai/` - AI service layer
  - `services/ai/openai.ts` - OpenAI integration
  - `services/ai/gemini.ts` - Gemini integration
  - `services/ai/claude.ts` - Claude integration
  - No database changes needed

## 📊 Build Output

### Frontend Build
```
✓ 564 modules transformed
dist/index.html                   0.90 kB
dist/assets/index.css            35.62 kB
dist/assets/index.js            671.28 kB
```

## 📝 License

MIT License - See LICENSE file for details

---

**Built with ❤️ for Civil Engineers**