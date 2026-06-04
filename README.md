# Safeen Inventory Management System

Inventory management system built for **Safeen Survey & Subsea Services L.L.C.** (Part of AD Ports Group, Abu Dhabi, UAE).

Replaces Excel-based inventory tracking and paper requisition forms with a web application featuring role-based access, automated stock alerts, and a digital requisition workflow.

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS v4, shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL 16
- **ORM**: Prisma 7
- **Auth**: JWT (httpOnly cookies)
- **Infrastructure**: Docker Compose

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- npm

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/DARK-Shadw/InventorySystem.git
cd InventorySystem
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env
```

The defaults in `.env.example` work with the Docker database out of the box — no changes needed for local dev.

### 4. Start the database

```bash
docker compose up -d
```

This starts a PostgreSQL 16 container on port 5432.

### 5. Run database migrations

```bash
npx prisma generate
npx prisma migrate dev
```

### 6. Seed demo data

```bash
npm run db:seed
```

This creates:
- 8 departments (Store, Survey, ROV, R&D, Diving, HSE, USV, PMT)
- 5 demo users (see below)
- 1 storeroom (SSMAIN)
- 2 locations (ASTRO ARCHERNER vessel, UAE/Rigmove barge)
- 1 sample project (2035)

### 7. Start the dev server

```bash
npm run dev
```

Open **http://localhost:3000** — you'll be redirected to the login page.

## Demo Users

All passwords: `admin123`

| Email | Name | Role | Department |
|---|---|---|---|
| admin@safeen.ae | Store Admin | Super Admin | Store |
| survey.head@safeen.ae | Ahmed Al Rashid | Dept. Head | Survey |
| rov.head@safeen.ae | James Thompson | Dept. Head | ROV |
| store.staff@safeen.ae | Mohammed Ali | Store Staff | Store |
| requester@safeen.ae | Sarah Kumar | Requester | Survey |

## Features

### Inventory Management (`/inventory`)
- Searchable/filterable item table with stock levels
- Add, edit, delete items
- Stock status indicators (In Stock / Low Stock / Out of Stock)

### Excel Import (`/import`)
- Upload .xlsx files from existing CMMS/Excel systems
- Auto-detects and maps column names
- Preview data before import
- Handles encoding cleanup, duplicates, commodity group creation

### Requisition Workflow (`/requisitions`)
- Create requisitions with item search, project/vessel selection
- Multi-level approval: Requester -> Dept Head -> Store
- Partial and full issuance with automatic inventory deduction
- Full audit trail of every stock movement
- Print/PDF export matching the original paper form layout

### Dashboard (`/dashboard`)
- Live stats: total items, low stock alerts, pending requisitions, out of stock
- Recent requisitions with status
- Low stock alerts sorted by urgency

### User Management (`/users`)
- Create and manage users with role assignments
- 5 roles: Super Admin, Store Manager, Store Staff, Dept. Head, Requester

### Alerts (`/alerts`)
- Alert rules: Reorder Point, Low Stock, Out of Stock
- Global (all items) or item-specific rules
- In-app notifications with unread count in header

### Reports (`/reports`)
- Inventory Summary (with total value)
- Low Stock / Reorder Report (with suggested EOQ and cost)
- Consumption by Department (with date range filter)
- Requisition History (with status breakdown)
- CSV export for all reports

## Project Structure

```
src/
  app/
    (dashboard)/          # Authenticated pages (sidebar layout)
      dashboard/          # Dashboard page
      inventory/          # Inventory CRUD
      import/             # Excel import wizard
      requisitions/       # Requisition list, create, detail
      users/              # User management
      alerts/             # Alert rules & notifications
      reports/            # Report generation
    api/                  # API routes
      auth/               # Login, logout, session
      items/              # Item CRUD + search
      requisitions/       # Requisition CRUD + approve + issue
      import/             # Excel import
      dashboard/          # Dashboard stats
      alerts/             # Alert rules + check
      notifications/      # User notifications
      reports/            # Report generation
      users/              # User CRUD
      departments/        # Department list
      projects/           # Project list
      locations/          # Location list
    login/                # Login page
    requisitions/[id]/print/  # Printable requisition form
  components/
    ui/                   # shadcn/ui components
    layout/               # Sidebar, header
    inventory/            # Item form dialog
  context/                # Auth context provider
  lib/                    # Prisma client, auth utils, helpers
prisma/
  schema.prisma           # Database schema (14 tables)
  seed.ts                 # Demo data seeder
  migrations/             # Database migrations
```

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:migrate` | Run database migrations |
| `npm run db:push` | Push schema changes (no migration) |
| `npm run db:seed` | Seed demo data |
| `npm run db:studio` | Open Prisma Studio (visual DB browser) |

## Database Schema

14 tables covering the full inventory lifecycle:

- **users** — Auth, roles, department assignment
- **departments** — 8 departments with store flag
- **commodity_groups** — Hierarchical item categories
- **items** — Master item catalog (28+ fields mapped from client Excel)
- **inventory** — Stock levels per storeroom
- **storerooms** — Physical storage locations
- **locations** — Vessels, barges, sites
- **projects** — Project tracking for cost allocation
- **requisitions** — Requisition headers with status workflow
- **requisition_items** — Line items with required vs issued quantities
- **requisition_approvals** — Multi-level approval chain
- **inventory_transactions** — Audit trail of all stock movements
- **alert_rules** — Stock alert configurations
- **notifications** — User notifications

## Requisition Workflow

```
DRAFT -> SUBMITTED -> DEPT_APPROVED -> APPROVED -> ISSUED
                   \-> REJECTED       \-> REJECTED
                                                \-> PARTIALLY_ISSUED -> ISSUED
```
