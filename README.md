# DapurCek — Frontend

Web application frontend for the **DapurCek** MBG kitchen construction monitoring platform, built with Next.js 16 and React 19.

---

## Tech Stack

| Category | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI Library | React 19 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| UI Components | Radix UI + shadcn/ui pattern |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| PDF Export | jsPDF + html2canvas-pro |
| Icons | Lucide React |
| Theme | next-themes (light default) |
| Package Manager | pnpm |

---

## Prerequisites

- **Node.js** v20+
- **pnpm** v9+

```bash
npm install -g pnpm
```

---

## Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

```env
# Backend
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001

# Basic Auth — client-side API calls
NEXT_PUBLIC_BASIC_AUTH_USERNAME=your_username
NEXT_PUBLIC_BASIC_AUTH_PASSWORD=your_password

# Basic Auth — server-side upload proxy (Next.js API Route)
BASIC_AUTH_USERNAME=your_username
BASIC_AUTH_PASSWORD=your_password
```

| Variable | Scope | Description | Default |
|---|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Client + Server | Backend API base URL | `https://api.dapurcek.id` |
| `NEXT_PUBLIC_BASIC_AUTH_USERNAME` | Client | Username for basic auth on client-side API requests | — |
| `NEXT_PUBLIC_BASIC_AUTH_PASSWORD` | Client | Password for basic auth on client-side API requests | — |
| `BASIC_AUTH_USERNAME` | Server only | Username for basic auth used by the upload proxy API route | — |
| `BASIC_AUTH_PASSWORD` | Server only | Password for basic auth used by the upload proxy API route | — |

> **Client vs Server:** Variables prefixed with `NEXT_PUBLIC_` are bundled into the browser build and visible to users. `BASIC_AUTH_USERNAME` and `BASIC_AUTH_PASSWORD` (without the prefix) are server-only and never exposed to the client. Both sets are required for the file upload feature to work.

### 3. Run development server

```bash
pnpm dev
```

The app will be available at `http://localhost:3000`.

---

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start development server with hot reload |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |

---

## Project Structure

```
app/
├── (app)/                  # Authenticated routes (requires login)
│   ├── dashboard/          # Dashboard overview
│   ├── projects/           # Project management
│   ├── users/              # User management (admin only)
│   ├── products/           # Product management (admin only)
│   ├── boq-templates/      # BOQ Templates (admin only)
│   ├── pdf-tools/          # PDF Tools (merge, split, compress)
│   ├── profile/            # User profile
│   └── ai-assistant/       # AI Assistant
├── (auth)/                 # Public auth routes
│   ├── login/
│   ├── signup/
│   ├── forgot-password/
│   └── reset-password/
├── api/                    # Next.js API routes
└── boqs-approval/          # Public BOQ approval page (no login required)

components/
├── layout/                 # AppSidebar, AppHeader, Breadcrumb, Logo
├── ui/                     # shadcn/ui base components
├── products/               # Product-specific components
├── projects/               # Project-specific components
├── templates/              # Template-specific components
└── providers/              # ThemeProvider

lib/
├── api/                    # API modules (one file per resource)
│   ├── config.ts           # Base URL, auth token helpers
│   ├── auth.ts
│   ├── boq.ts
│   ├── files.ts
│   ├── folders.ts
│   ├── pdf-tools.ts
│   ├── products.ts
│   ├── projects.ts
│   ├── templates.ts
│   ├── users.ts
│   └── ...
└── utils.ts                # cn() utility (clsx + tailwind-merge)

hooks/
├── use-debounce.ts
└── use-toast.ts
```

---

## Pages & Routes

### Authenticated (`/`)

| Route | Description | Access |
|---|---|---|
| `/dashboard` | Overview & summary | All users |
| `/projects` | Project list & detail | All users |
| `/users` | User management | Admin only |
| `/products` | Product management | Admin only |
| `/boq-templates` | BOQ template management | Admin only |
| `/pdf-tools` | PDF Tools — merge, split, compress | All users |
| `/profile` | User profile settings | All users |
| `/ai-assistant` | AI-powered assistant | All users |

### Public

| Route | Description |
|---|---|
| `/login` | Login page |
| `/signup` | Register new account |
| `/forgot-password` | Request password reset |
| `/reset-password` | Reset password via token |
| `/boqs-approval` | BOQ approval page (shared link, no login) |

---

## Sidebar Structure

```
Main Menu
  Dashboard
  Projects
  User Management     (admin only)
  Product Management  (admin only)
  BOQ Templates       (admin only)

TOOLS
  PDF Tools

Other
  Profile
```

Admin-only items are hidden based on the `admin` flag returned from `GET /users/profile`.

---

## Authentication

- Auth token is stored in **localStorage** under the key `auth_token`
- All API requests attach the token via `Authorization: Bearer <token>` header
- Token is read/written/cleared via helpers in `lib/api/config.ts`
- Unauthenticated requests redirect to `/login`

---

## PDF Tools

Located at `/pdf-tools`. Provides three utilities in a tabbed interface:

| Tab | Description |
|---|---|
| **Merge** | Upload multiple PDFs → merge into one file. Output filename: `file1_file2_merged.pdf` |
| **Split** | Upload one PDF → split per page or by custom page ranges. Output: ZIP file with individual PDFs. Filename: `document_splitted_p1-3_p4.zip` |
| **Compress** | Upload one PDF → reduce file size using Ghostscript. Output filename: `document_compressed_<preset>.pdf` |

### Compress Presets

| Preset | DPI | Description |
|---|---|---|
| Auto | Dynamic | Picks highest DPI that achieves ≥20% reduction |
| Light | 250 dpi | Minimal compression, near-original quality |
| Balanced | 150 dpi | Good compression, decent quality |
| Aggressive | 96 dpi | Smaller file, lower quality |
| Maximum | 48 dpi | Smallest file, lowest quality |

> **Note:** PDF compression is powered by **Ghostscript** on the backend server. Ghostscript must be installed on the server for compress to work. See the backend README for installation instructions.

---

## Deployment

```bash
pnpm build
pnpm start
```

Ensure `NEXT_PUBLIC_API_BASE_URL` points to the production backend URL before building, as the value is inlined at build time.
