# SpinLytics Backend — Deep Dive Documentation

> Scope: **backend/** only (Node.js + Express + Prisma + PostgreSQL).  
> Goal: give you a complete, client-ready understanding of **what exists**, **how it works**, **how data flows**, and **how reports/metrics are computed**.

---

## Table of Contents

1. [What this backend is](#what-this-backend-is)
2. [Tech stack and dependencies](#tech-stack-and-dependencies)
3. [How to run locally](#how-to-run-locally)
4. [Project structure (file-by-file map)](#project-structure-file-by-file-map)
5. [HTTP API conventions](#http-api-conventions)
6. [Database (PostgreSQL + Prisma)](#database-postgresql--prisma)
   - [Enums](#enums)
   - [Models and tables](#models-and-tables)
   - [Indexes, uniqueness, and performance](#indexes-uniqueness-and-performance)
   - [Relationships](#relationships)
7. [Business calculations and formulas](#business-calculations-and-formulas)
8. [Modules and endpoints](#modules-and-endpoints)
   - [Health](#health)
   - [Production](#production)
   - [Stock](#stock)
   - [Packing](#packing)
   - [Dispatch](#dispatch)
   - [EB](#eb)
   - [Dashboard / Reports](#dashboard--reports)
9. [End-to-end data flow (client → API → DB → reports)](#end-to-end-data-flow-client--api--db--reports)
10. [Known gaps / gotchas / client-facing FAQs](#known-gaps--gotchas--client-facing-faqs)
11. [Appendix: Example requests/responses](#appendix-example-requestsresponses)

---

## What this backend is

SpinLytics backend is a small **ERP-lite** REST API for a textile spinning workflow.

It supports these business areas:

- **Production**: frame-wise (Frame 41 and Frame 47) daily production entries.
- **Stock**: transaction-based inventory ledger for raw materials, yarn, and waste.
- **Packing**: packing entries (bags → kg), intended as a bridge between production and stock.
- **Dispatch**: outgoing stock movement to parties; also auto-creates a stock ledger transaction.
- **EB**: monthly electricity meter readings; units consumed are derived.
- **Dashboard**: daily, monthly, yearly reports generated from stored data + formulas.

The system is built around 2 core principles (also stated in requirements):

1. **Transaction-based stock**: stock is not stored as a single running balance — it is derived from the ledger.
2. **Do not store derived metrics**: losses/percentages/UKG/etc are computed dynamically.

Primary entrypoints:

- `src/server.js` starts the HTTP server and connects Prisma.
- `src/app.js` sets up Express middleware and mounts routes at `/api/v1`.

---

## Tech stack and dependencies

From `backend/package.json`:

- **Node.js + Express** (`express`)
  - REST server and routing.
- **Prisma ORM** (`prisma`, `@prisma/client`)
  - DB schema, migrations/push, and type-safe database access.
- **PostgreSQL** (Prisma datasource provider)
  - The actual database.
- **Zod** (`zod`)
  - Request validation for body/query/params.
- **Decimal.js** (`decimal.js`)
  - High-precision math for business calculations (avoid floating point errors).
- **dotenv**
  - Loads environment variables from `.env`.
- **helmet**
  - Sets security-related HTTP headers.
- **cors**
  - Allows cross-origin requests (currently wide open in dev).
- **morgan**
  - HTTP request logging.
- **nodemon** (dev dependency)
  - Auto-restarts server in development.

---

## How to run locally

### 1) Configure environment

Create `backend/.env` (or use `.env.example` as a template):

- `DATABASE_URL` — Postgres connection string
- `PORT` — defaults to 5000
- `NODE_ENV` — `development` by default

Example (from `.env.example`):

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/spinlytics?schema=public"
PORT=5000
NODE_ENV=development
```

### 2) Install dependencies

```bash
cd backend
npm install
```

### 3) Prisma client generation

```bash
npm run db:generate
```

### 4) Create DB schema

There are a few ways (depends on your workflow):

- Push schema directly (no migrations):

```bash
npm run db:push
```

- Or run migrations (if migration files exist / you create them):

```bash
npm run db:migrate
```

### 5) Start the server

- Development (auto-reload):

```bash
npm run dev
```

- Production-style start:

```bash
npm start
```

### 6) Verify health

- `GET http://localhost:5000/api/v1/health`

---

## Project structure (file-by-file map)

Everything backend-related is inside `backend/`:

- `src/server.js`
  - Connects Prisma (`prisma.$connect()`), starts Express on configured port, logs module URLs.
  - Handles graceful shutdown on `SIGINT` / `SIGTERM` by `prisma.$disconnect()`.

- `src/app.js`
  - Express app setup.
  - Middleware order:
    1. `helmet()`
    2. `cors(...)`
    3. `express.json()` + `express.urlencoded()`
    4. `morgan('dev')`
    5. mounts all API routes at `/api/v1`
    6. root `/` route (API info)
    7. 404 handler
    8. global error handler

- `src/config/index.js`
  - Loads dotenv and returns config object (port, nodeEnv, databaseUrl, isDev/isProd flags).

- `src/config/database.js`
  - PrismaClient singleton.
  - In production: new PrismaClient with `log: ['error']`.
  - In dev: attaches Prisma client to `global.__prisma` to avoid hot-reload duplication.

- `src/routes/*.routes.js`
  - Defines the REST endpoints for each module.

- `src/controllers/*.controller.js`
  - HTTP-level functions (req/res) that call services.
  - Uses `asyncHandler` to pass async errors to Express.
  - Uses `ApiResponse` for consistent response shape (except delete which returns a simple JSON).

- `src/services/*.service.js`
  - Business logic + DB operations.
  - All Prisma queries live here.

- `src/validators/*.validator.js`
  - Zod schemas to validate request bodies / queries / params.

- `src/middleware/*.js`
  - `validate` — Zod validation middleware.
  - `asyncHandler` — wraps async controller functions.
  - `errorHandler` — global JSON error formatting.
  - `auth` — placeholder (not currently used in routes).

- `src/utils/*.js`
  - `calculations.js` — ALL formulas.
  - `constants.js` — enums/constants shared between services.
  - `ApiError.js` — consistent error type.
  - `ApiResponse.js` — consistent success response wrapper.

- `prisma/schema.prisma`
  - Prisma schema: enums, models, indexes.

---

## HTTP API conventions

### Base URL

All routes are mounted under:

- `/api/v1`

Module prefixes:

- `/api/v1/production`
- `/api/v1/stock`
- `/api/v1/packing`
- `/api/v1/dispatch`
- `/api/v1/eb`
- `/api/v1/dashboard`

### Middleware chain (request lifecycle)

1. **Security headers** via `helmet()`
2. **CORS** via `cors(...)`
   - Currently `origin: '*'` (wide open). Suitable for internal/dev; should be restricted for production.
3. **Body parsing**
   - JSON up to 10MB
   - URL-encoded for simple form posts
4. **Logging** via `morgan('dev')`
5. **Routes**
6. **404 handler** returns JSON `{ success: false, message: ... }`
7. **Global error handler** (see below)

### Success response format

Most endpoints return:

```json
{
  "statusCode": 200,
  "success": true,
  "message": "...",
  "data": {}
}
```

This is produced by `src/utils/ApiResponse.js`.

Notes:

- `ApiResponse.created(...)` sets status code **201**.
- Delete endpoints currently return:

```json
{ "success": true, "message": "..." }
```

(not the ApiResponse envelope).

### Error response format

All errors eventually pass through `src/middleware/errorHandler.js`.

- If an error is an `ApiError`, its `statusCode/message/errors` are used.
- If it’s a normal error, it gets wrapped into an `ApiError` (500 by default).

Common shapes:

- Validation error (Zod), thrown via `validate` middleware:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "productionKg",
      "message": "Production must be positive",
      "source": "body"
    }
  ]
}
```

- Not found:

```json
{ "success": false, "message": "Production entry not found" }
```

In development (`NODE_ENV=development`), the error handler also includes a `stack` field.

### Validation behavior (important)

The `validate` middleware does 3 things:

1. Validates `req.body`, `req.query`, `req.params` using Zod schemas.
2. If parsing succeeds it **replaces** `req.body/query/params` with the parsed/transformed data.
3. If it fails, it aggregates issues and throws `ApiError.badRequest(...)`.

This is why query params like `page=1` become actual numbers (Zod transform + pipe).

### Status codes used

Across the codebase the API uses these HTTP status codes:

- **200** — successful reads and updates
- **201** — successful creates (`ApiResponse.created`)
- **400** — validation failures and business rule failures (e.g., insufficient stock)
- **404** — resource not found (by ID, or EB month/year not found)
- **409** — uniqueness conflicts (duplicate production entry; duplicate EB month/year)
- **500** — unexpected errors (wrapped into `ApiError` in the error handler)

### Pagination contract

List endpoints that support pagination return:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0
  }
}
```

Implementation details (important when explaining “why page 2 shows these rows”):

- Defaults: `page=1`, `limit=20`
- Max limit enforced by validators: `limit <= 100`
- Prisma pagination:
  - `skip = (page - 1) * limit`
  - `take = limit`

### Dates and timezones (important)

The API standardizes on date strings in **YYYY-MM-DD** format (validated with regex in Zod). Internally:

- Services convert via `new Date(dateString)` and store into Prisma fields defined as `@db.Date`.
- JavaScript parses date-only strings (`YYYY-MM-DD`) as **UTC midnight** (per ISO-8601 parsing rules).

Practical implication:

- If the server runs in a timezone far from UTC (especially negative-offset timezones), there is potential for “off-by-one day” behavior when converting between string dates, JS `Date`, and DB DATE columns.
- `getClosingStock(date)` sets `endOfDay.setHours(23,59,59,999)` using the server’s local timezone, which can amplify timezone mismatches.

If your client asks about date correctness:

- The intended semantic is **calendar-date-based accounting** (not timestamp-based).
- The safest production deployment is to keep server and DB in the same expected timezone and treat dates as local-business dates.

### Decimal / number handling in responses

This backend stores many numeric fields as SQL DECIMAL.

- Prisma typically represents DECIMAL values as a Decimal-like object that serializes to **string** in JSON.
- Calculated fields are explicitly formatted with `.toFixed(...)`, which also produces **strings**.

So client apps should not assume every numeric-looking value is a JSON number; some will be strings (especially decimals).

---

## Database (PostgreSQL + Prisma)

Prisma schema: `prisma/schema.prisma`.

### Key DB characteristics

- Provider: **PostgreSQL**
- Prisma client generator: `prisma-client-js`
- Decimal fields are stored as `Decimal(p,s)` in Postgres and mapped to Prisma `Decimal`.
- Many columns are indexed for dashboard/report query performance.

### Enums

Defined enums:

- `FrameNumber`: `FRAME_41`, `FRAME_47`
- `MaterialType`: `COTTON`, `VISCOSE`, `FIBER`, `EXCEL`, `YARN`, `WASTE`
- `TransactionType`: `PURCHASE`, `ISSUE`, `DISPATCH`, `RETURN`
- `PackingSource`: `AUTOCORNER`, `PRODUCTION`

These enums restrict valid values in the DB AND they’re mirrored in Zod validators at the API layer.

### Models and tables

#### 1) ProductionEntry → `production_entries`

Purpose: one production record **per frame per day**.

Columns:

- `id` UUID (primary key)
- `date` DATE (no time)
- `frameNumber` enum FrameNumber
- `productionKg` decimal(12,3)
- `autocornerProductionKg` decimal(12,3)
- `packingKg` decimal(12,3)
- `ebUnits` decimal(12,3) — daily EB units (per entry)
- `noOfSpindles` int
- `remarks` string nullable
- `createdAt`, `updatedAt`

Constraints:

- Unique composite key: `(date, frameNumber)`
  - prevents duplicates for the same date+frame.

Derived metrics (NOT stored):

- spinning loss kg/%
- autocorner loss kg/%
- UKG
- GPS

These are computed when returning API data.

#### 2) StockTransaction → `stock_transactions`

Purpose: transaction ledger for inventory. **Stock is derived**, not stored.

Columns:

- `id` UUID (primary key)
- `date` DATE
- `materialType` enum MaterialType
- `transactionType` enum TransactionType
- `lotNo`, `partyName`
- `bags` decimal(10,2)
- `kgs` decimal(12,3) — computed as bags × 60 in services
- `pricePerBag` decimal(12,2) nullable
- `totalPrice` decimal(14,2) nullable
- `remarks` nullable
- `createdAt`, `updatedAt`

Stock derivation rule (implemented in services):

- Current Stock = SUM(inflows) − SUM(outflows)
- Inflows = `PURCHASE`, `RETURN`
- Outflows = `ISSUE`, `DISPATCH`

#### 3) PackingEntry → `packing_entries`

Purpose: packing records (bags/kgs) with a `source`.

Columns:

- `id` UUID
- `date` DATE
- `source` enum PackingSource (`AUTOCORNER` or `PRODUCTION`)
- `yarnType` string
- `bags` decimal(10,2)
- `kgs` decimal(12,3) — computed as bags × 60
- `lotNo`
- `remarks` nullable
- `createdAt`, `updatedAt`

Note: requirements describe packing as “core integration that updates stock”. In **current backend code**, packing entries are stored but **do not automatically create stock transactions**.

#### 4) DispatchEntry → `dispatch_entries`

Purpose: dispatch records to parties. This represents a business event (“we dispatched X bags to Y”).

Columns:

- `id` UUID
- `date` DATE
- `materialType` enum MaterialType
- `lotNo`, `partyName`
- `bags` decimal(10,2)
- `kgs` decimal(12,3) — computed as bags × 60
- `pricePerBag`, `totalPrice`, `remarks`
- `createdAt`, `updatedAt`

Important behavior: **creating a DispatchEntry also creates a StockTransaction with transactionType = DISPATCH** (atomic Prisma transaction).

#### 5) EBEntry → `eb_entries`

Purpose: monthly meter readings (opening/closing units).

Columns:

- `id` UUID
- `month` int (1–12)
- `year` int
- `openingUnits` decimal(12,3)
- `closingUnits` decimal(12,3)
- `createdAt`, `updatedAt`

Constraint:

- Unique composite key: `(month, year)`

Derived metric:

- units consumed = closing − opening (computed at query time)

### Indexes, uniqueness, and performance

Indexes are explicitly defined in Prisma using `@@index(...)`.

High-level intent:

- Most dashboards filter by **date ranges**, **material types**, **transaction types**, and **lot/party**.
- Production dashboards filter by **date** and sometimes frame.
- Stock dashboards group by material/lot/party, and filter by date.

Notable indexes:

- `ProductionEntry`: indexes on `date` and `frameNumber`, plus unique `(date, frameNumber)`.
- `StockTransaction`: indexes on `date`, `materialType`, `transactionType`, `lotNo`, `partyName`, plus composites `(date, materialType)` and `(materialType, lotNo)`.
- `PackingEntry`: indexes on `date`, `source`, `lotNo`.
- `DispatchEntry`: indexes on `date`, `materialType`, `lotNo`, `partyName`, and composite `(date, materialType)`.
- `EBEntry`: index on `year`, plus unique `(month, year)`.

These help the `groupBy` and `findMany` queries used in reports.

### Relationships

**There are no explicit foreign-key relationships in the database schema.**

Instead, “relationships” are **conceptual/business relationships** implemented in code:

- Dispatch → StockTransaction (created automatically)
- Dashboards → read from ProductionEntry + StockTransaction + EBEntry

This means:

- The DB will not enforce that a dispatch always has a matching stock transaction.
- The app logic must maintain consistency.

### Table mapping summary (`@@map`)

Prisma models are mapped to these Postgres table names:

- `ProductionEntry` → `production_entries`
- `StockTransaction` → `stock_transactions`
- `PackingEntry` → `packing_entries`
- `DispatchEntry` → `dispatch_entries`
- `EBEntry` → `eb_entries`

### Data flow (tables used by each module)

The diagram below is a **data-flow** view (not a relational ER diagram) showing which API modules write/read which tables.

```mermaid
flowchart LR
  Client[Client Apps]\n(Mobile + Web) --> API[Express API\n/api/v1]

  API -->|write/read| PROD[(production_entries)]
  API -->|write/read| STOCK[(stock_transactions)]
  API -->|write/read| PACK[(packing_entries)]
  API -->|write/read| DISP[(dispatch_entries)]
  API -->|write/read| EB[(eb_entries)]

  subgraph Modules
    P[Production module]
    S[Stock module]
    K[Packing module]
    D[Dispatch module]
    E[EB module]
    R[Dashboard module]
  end

  API --> P
  API --> S
  API --> K
  API --> D
  API --> E
  API --> R

  P -->|writes| PROD
  P -->|reads + calculates| PROD

  S -->|writes| STOCK
  S -->|reads + aggregates| STOCK

  K -->|writes| PACK
  K -->|reads| PACK

  D -->|writes| DISP
  D -->|writes (auto DISPATCH)| STOCK
  D -->|reads (stock check)| STOCK

  E -->|writes| EB
  E -->|reads + calculates| EB

  R -->|reads + aggregates| PROD
  R -->|reads + aggregates| STOCK
  R -->|reads| EB
```

### Prisma schema (verbatim)

This is the authoritative DB definition used by Prisma (enums, models, indexes, uniqueness):

```prisma
// Prisma Schema for SpinLytics
// Textile Production ERP-lite System

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── ENUMS ────────────────────────────────────────

enum FrameNumber {
  FRAME_41
  FRAME_47
}

enum MaterialType {
  COTTON
  VISCOSE
  FIBER
  EXCEL
  YARN
  WASTE
}

enum TransactionType {
  PURCHASE
  ISSUE
  DISPATCH
  RETURN
}

enum PackingSource {
  AUTOCORNER
  PRODUCTION
}

// ─── MODELS ───────────────────────────────────────

/// Production entries - one per frame per day
/// Tracks machine-level production with Frame 41 & 47
/// Derived values (spinning loss, UKG, GPS) are calculated at query time
model ProductionEntry {
  id                     String      @id @default(uuid())
  date                   DateTime    @db.Date
  frameNumber            FrameNumber
  productionKg           Decimal     @db.Decimal(12, 3)
  autocornerProductionKg Decimal     @db.Decimal(12, 3)
  packingKg              Decimal     @db.Decimal(12, 3)
  ebUnits                Decimal     @db.Decimal(12, 3)
  noOfSpindles           Int
  remarks                String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([date, frameNumber])
  @@index([date])
  @@index([frameNumber])
  @@map("production_entries")
}

/// Stock transactions - transaction-based inventory management
/// Stock is NEVER stored as a running balance.
/// Current stock = SUM(PURCHASE + RETURN) - SUM(ISSUE + DISPATCH)
model StockTransaction {
  id              String          @id @default(uuid())
  date            DateTime        @db.Date
  materialType    MaterialType
  transactionType TransactionType
  lotNo           String
  partyName       String
  bags            Decimal         @db.Decimal(10, 2)
  kgs             Decimal         @db.Decimal(12, 3)
  pricePerBag     Decimal?        @db.Decimal(12, 2)
  totalPrice      Decimal?        @db.Decimal(14, 2)
  remarks         String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([date])
  @@index([materialType])
  @@index([transactionType])
  @@index([lotNo])
  @@index([partyName])
  @@index([date, materialType])
  @@index([materialType, lotNo])
  @@map("stock_transactions")
}

/// Packing entries - bridge between production and stock
/// Each packing entry feeds into stock and loss calculations
model PackingEntry {
  id       String        @id @default(uuid())
  date     DateTime      @db.Date
  source   PackingSource
  yarnType String
  bags     Decimal       @db.Decimal(10, 2)
  kgs      Decimal       @db.Decimal(12, 3)
  lotNo    String
  remarks  String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([date])
  @@index([source])
  @@index([lotNo])
  @@map("packing_entries")
}

/// Dispatch entries - outgoing stock to parties
/// Each dispatch reduces stock (creates a DISPATCH stock transaction)
model DispatchEntry {
  id           String       @id @default(uuid())
  date         DateTime     @db.Date
  materialType MaterialType
  lotNo        String
  partyName    String
  bags         Decimal      @db.Decimal(10, 2)
  kgs          Decimal      @db.Decimal(12, 3)
  pricePerBag  Decimal?     @db.Decimal(12, 2)
  totalPrice   Decimal?     @db.Decimal(14, 2)
  remarks      String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([date])
  @@index([materialType])
  @@index([lotNo])
  @@index([partyName])
  @@index([date, materialType])
  @@map("dispatch_entries")
}

/// EB (Electricity Board) entries - monthly electricity consumption
/// EB Units = Closing - Opening (calculated at query time)
model EBEntry {
  id           String  @id @default(uuid())
  month        Int
  year         Int
  openingUnits Decimal @db.Decimal(12, 3)
  closingUnits Decimal @db.Decimal(12, 3)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([month, year])
  @@index([year])
  @@map("eb_entries")
}
```

---

## Business calculations and formulas

All formulas live in `src/utils/calculations.js`.

### Precision strategy

- Uses `decimal.js` with precision 20 and `ROUND_HALF_UP`.
- Services often output `.toFixed(...)`, producing **strings**.

### Core conversion

- `1 bag = 60 kg`
- `kg = bags × 60`

### Production formulas

Let:

- $P$ = productionKg
- $A$ = autocornerProductionKg
- $K$ = packingKg
- $E$ = ebUnits
- $S$ = noOfSpindles

Formulas:

- Spinning Loss (kg): $P - A$
- Spinning Loss (%): $\frac{P-A}{P} \times 100$ (if $P=0$, returns 0)
- Autocorner Loss (kg): $A - K$
- Autocorner Loss (%): $\frac{A-K}{A} \times 100$ (if $A=0$, returns 0)
- UKG: $\frac{E}{P}$ (if $P=0$, returns 0)
- GPS: $\frac{P}{S}$ (if $S=0$, returns 0)

### EB formula

- EB Units Consumed: `closingUnits - openingUnits`

### Monthly costing/reporting formulas

Let:

- $CI$ = total cotton issue (sum of issued raw materials)
- $W$ = total waste (net waste from stock transactions for WASTE)
- $TP$ = total production (sum of productionKg for the month)

Formulas implemented:

- Cotton Issue: `cotton + fiber + viscose + excel` (ISSUE transactions only)
- Yarn Realisation (%): $\frac{TP}{CI} \times 100$ (if $CI=0$, returns 0)
- Waste (%): $\frac{W}{CI} \times 100$ (if $CI=0$, returns 0)
- Invisible Loss (%): $100 - Realisation\% - Waste\%$
- Monthly UKG: $\frac{EB\ Units}{TP}$

#### Important note: requirements vs implementation

In `Requirements.MD`, the Monthly Dashboard section shows:

> `Yarn Realisation % = (Cotton Issue - Production) / Cotton Issue`

But `src/utils/calculations.js` explicitly comments and implements:

> **Realisation = Production / Cotton Issue × 100**

So the backend uses **Production / Cotton Issue**.

If your client asks: explain that the code follows the corrected interpretation.

---

## Modules and endpoints

Routes are mounted in `src/routes/index.js` and then attached under `/api/v1` by `src/app.js`.

### Full API map (all endpoints)

| Area       | Method | Path                                     | What it does                                                               |
| ---------- | ------ | ---------------------------------------- | -------------------------------------------------------------------------- |
| Health     | GET    | `/api/v1/health`                         | Health check + timestamp                                                   |
| Production | POST   | `/api/v1/production`                     | Create one production entry (unique per date+frame)                        |
| Production | GET    | `/api/v1/production`                     | List production entries (filters + pagination)                             |
| Production | GET    | `/api/v1/production/daily/:date`         | Get frame entries for a date + optional combined totals                    |
| Production | GET    | `/api/v1/production/:id`                 | Get a production entry by UUID                                             |
| Production | PUT    | `/api/v1/production/:id`                 | Update a production entry                                                  |
| Production | DELETE | `/api/v1/production/:id`                 | Delete a production entry                                                  |
| Stock      | POST   | `/api/v1/stock/transactions`             | Create a stock transaction (bags→kg; prevents negative stock for outflows) |
| Stock      | GET    | `/api/v1/stock/transactions`             | List stock transactions (filters + pagination)                             |
| Stock      | GET    | `/api/v1/stock/transactions/:id`         | Get a single transaction                                                   |
| Stock      | PUT    | `/api/v1/stock/transactions/:id`         | Update a transaction (recomputes kg/totalPrice when needed)                |
| Stock      | DELETE | `/api/v1/stock/transactions/:id`         | Delete a transaction                                                       |
| Stock      | GET    | `/api/v1/stock/current`                  | Current stock per material (derived)                                       |
| Stock      | GET    | `/api/v1/stock/current/:materialType`    | Current stock for one material                                             |
| Stock      | GET    | `/api/v1/stock/lot-wise`                 | Lot-wise stock summary                                                     |
| Stock      | GET    | `/api/v1/stock/party-wise`               | Party-wise stock summary                                                   |
| Stock      | GET    | `/api/v1/stock/opening/:date`            | Opening stock as of a date (all txns before date)                          |
| Stock      | GET    | `/api/v1/stock/closing/:date`            | Closing stock as of a date (all txns up to end-of-day)                     |
| Packing    | POST   | `/api/v1/packing`                        | Create a packing entry (bags→kg)                                           |
| Packing    | GET    | `/api/v1/packing`                        | List packing entries (filters + pagination)                                |
| Packing    | GET    | `/api/v1/packing/:id`                    | Get packing entry                                                          |
| Packing    | PUT    | `/api/v1/packing/:id`                    | Update packing entry                                                       |
| Packing    | DELETE | `/api/v1/packing/:id`                    | Delete packing entry                                                       |
| Dispatch   | POST   | `/api/v1/dispatch`                       | Create dispatch entry AND auto-create stock DISPATCH transaction           |
| Dispatch   | GET    | `/api/v1/dispatch`                       | List dispatch entries (filters + pagination)                               |
| Dispatch   | GET    | `/api/v1/dispatch/:id`                   | Get dispatch entry                                                         |
| Dispatch   | PUT    | `/api/v1/dispatch/:id`                   | Update dispatch entry (does NOT sync stock ledger)                         |
| Dispatch   | DELETE | `/api/v1/dispatch/:id`                   | Delete dispatch entry (does NOT delete stock ledger)                       |
| EB         | POST   | `/api/v1/eb`                             | Create EB monthly entry (unique per month+year)                            |
| EB         | GET    | `/api/v1/eb`                             | List EB entries (filter by year + pagination)                              |
| EB         | GET    | `/api/v1/eb/month/:year/:month`          | Get EB entry for a month/year                                              |
| EB         | GET    | `/api/v1/eb/:id`                         | Get EB entry by UUID                                                       |
| EB         | PUT    | `/api/v1/eb/:id`                         | Update EB entry                                                            |
| EB         | DELETE | `/api/v1/eb/:id`                         | Delete EB entry                                                            |
| Dashboard  | GET    | `/api/v1/dashboard/daily/:date`          | Daily dashboard computed from production entries                           |
| Dashboard  | GET    | `/api/v1/dashboard/monthly/:year/:month` | Monthly dashboard computed from production + stock + EB                    |
| Dashboard  | GET    | `/api/v1/dashboard/yearly/:year`         | Yearly view (12 monthly summaries)                                         |
| Dashboard  | GET    | `/api/v1/dashboard/stock`                | Stock dashboard computed from stock transactions                           |

### Health

- `GET /api/v1/health`
  - Returns server status + timestamp.

### Production

Route file: `src/routes/production.routes.js`  
Service: `src/services/production.service.js`

#### Data stored

Writes to `ProductionEntry`.

#### Validation schemas (Zod)

Defined in `src/validators/production.validator.js`.

- **Body (create)**: `createProductionSchema`
  - `date`: string, must match `YYYY-MM-DD`
  - `frameNumber`: enum `FRAME_41 | FRAME_47`
  - `productionKg`: number, **> 0**
  - `autocornerProductionKg`: number, **> 0**
  - `packingKg`: number, **>= 0**
  - `ebUnits`: number, **>= 0**
  - `noOfSpindles`: integer number, **> 0**
  - `remarks`: optional/nullable string, max length 500
  - Business rules (`refine`):
    - `autocornerProductionKg <= productionKg`
    - `packingKg <= autocornerProductionKg`
- **Body (update)**: `updateProductionSchema`
  - Partial version of the base schema (any subset of fields).
- **Query (list)**: `productionQuerySchema`
  - `startDate`, `endDate`: optional `YYYY-MM-DD`
  - `frameNumber`: optional `FRAME_41 | FRAME_47`
  - `page`, `limit`: optional strings that are transformed to numbers and validated
    - `page`: positive int
    - `limit`: positive int, max 100
- **Params**:
  - `idParamSchema`: `{ id: uuid }`
  - `dateParamSchema`: `{ date: YYYY-MM-DD }`

#### Endpoints

1. `POST /api/v1/production`

- Purpose: create a production entry for a date + frame.
- Validation: `createProductionSchema` (see above)
- Controller: `src/controllers/production.controller.js#create`
- Service: `productionService.create(data)`
- DB operations (Prisma):
  1. Duplicate check using the composite unique constraint:
     - `productionEntry.findUnique({ where: { date_frameNumber: { date, frameNumber }}})`
  2. Insert:
     - `productionEntry.create({ data: { ... }})`
- Computed output:
  - The service adds `entry.calculated`:
    - `spinningLossKg`, `spinningLossPercent`
    - `autocornerLossKg`, `autocornerLossPercent`
    - `ukg`, `gps`
  - These are formatted with `.toFixed(...)` (strings).
- Common error cases:
  - **400**: validation failed
  - **409**: an entry already exists for the same date + frame

2. `GET /api/v1/production`

- Purpose: list entries with optional filters + pagination.
- Validation: `productionQuerySchema`
- Controller: `src/controllers/production.controller.js#getAll`
- Service: `productionService.findAll(query)`
- DB operations (Prisma):
  - Builds a `where` object:
    - optional `where.date.gte` and/or `where.date.lte`
    - optional `where.frameNumber`
  - Executes in parallel:
    - `productionEntry.findMany({ where, orderBy: [{ date: 'desc' }, { frameNumber: 'asc' }], skip, take })`
    - `productionEntry.count({ where })`
- Response data shape:
  - `{ data: ProductionEntryWithCalculated[], pagination: {...} }`

3. `GET /api/v1/production/daily/:date`

- Purpose: fetch all frame entries for a date (daily view).
- Validation: `dateParamSchema`
- Controller: `src/controllers/production.controller.js#getByDate`
- Service: `productionService.findByDate(date)`
- DB operations (Prisma):
  - `productionEntry.findMany({ where: { date: new Date(date) }, orderBy: { frameNumber: 'asc' } })`
- Response details:
  - `frames`: array of stored entries + `calculated`
  - `totals`:
    - Only computed when **both frames are present** (`frames.length === 2`).
    - Includes totals and derived metrics computed on totals:
      - `spinningLossPercent`, `autocornerLossPercent`, `ukg`, `gps`

4. `GET /api/v1/production/:id`

- Validation: `idParamSchema`
- Controller: `src/controllers/production.controller.js#getById`
- Service: `productionService.findById(id)`
- DB operations: `productionEntry.findUnique({ where: { id } })`
- If missing: throws `ApiError.notFound(...)` → **404**

5. `PUT /api/v1/production/:id`

- Purpose: update an entry.
- Validation: `idParamSchema` + `updateProductionSchema`
- Controller: `src/controllers/production.controller.js#update`
- Service: `productionService.update(id, data)`
- DB operations (Prisma):
  1. Ensure entry exists: `findUnique({ id })` else 404.
  2. If `date` or `frameNumber` is changing: conflict check using `findFirst({ where: { date, frameNumber, NOT: { id }}})`.
  3. Update: `productionEntry.update({ where: { id }, data: updateData })`.
- Response: updated entry + `calculated` metrics.

6. `DELETE /api/v1/production/:id`

- Purpose: delete an entry.
- Validation: `idParamSchema`
- Controller: `src/controllers/production.controller.js#remove`
- Service: `productionService.remove(id)`
- DB operations:
  - Check exists `findUnique({ id })` else 404
  - Delete `delete({ id })`

#### Where calculations are applied

- `production.service.js` enriches each entry via `enrichWithCalculations(entry)`.
- The calculated fields are returned under `entry.calculated`.

### Stock

Route file: `src/routes/stock.routes.js`  
Service: `src/services/stock.service.js`

#### Data stored

Writes to `StockTransaction`.

#### Key idea

- The backend never stores “current stock” in a table.
- It derives stock using groupBy aggregation on transactions.

#### Inflow vs outflow (inventory math)

Inventory math is centralized in `src/utils/constants.js`:

- **Inflow types** (increase stock): `PURCHASE`, `RETURN`
- **Outflow types** (decrease stock): `ISSUE`, `DISPATCH`

So for any grouping key (material / lot / party):

- StockKg = SUM(inflow.kgs) − SUM(outflow.kgs)

#### Validation schemas (Zod)

Defined in `src/validators/stock.validator.js`.

- **Body (create)**: `createStockTransactionSchema`
  - `date`: `YYYY-MM-DD`
  - `materialType`: `COTTON | VISCOSE | FIBER | EXCEL | YARN | WASTE`
  - `transactionType`: `PURCHASE | ISSUE | DISPATCH | RETURN`
  - `lotNo`: string 1..100
  - `partyName`: string 1..200
  - `bags`: number > 0
  - `pricePerBag`: optional/nullable number >= 0
  - `remarks`: optional/nullable string (max 500)
- **Body (update)**: `updateStockTransactionSchema` = partial
- **Query (list)**: `stockQuerySchema`
  - `startDate`, `endDate`: optional `YYYY-MM-DD`
  - `materialType`, `transactionType`: optional enums
  - `lotNo`, `partyName`: optional strings
  - `page`, `limit`: optional strings → transformed to ints (`limit <= 100`)
- **Params**:
  - `materialParamSchema`: `{ materialType: enum(...) }`
  - `idParamSchema`: `{ id: uuid }`
  - `dateParamSchema`: `{ date: YYYY-MM-DD }`

#### Endpoints

1. `POST /api/v1/stock/transactions`

- Validation: `createStockTransactionSchema`
- Controller: `src/controllers/stock.controller.js#create`
- Service: `stockService.create(data)`
- Steps:
  1. Compute `kgs = bagToKg(bags)` (bags × 60) and store both `bags` and `kgs`.
  2. Compute `totalPrice` if `pricePerBag` is provided.
  3. If transaction is an outflow (`ISSUE`/`DISPATCH`):
     - Compute current stock for `materialType` by `groupBy` on `transactionType` and net inflow/outflow.
     - If insufficient, throw **400** with an “Insufficient stock …” message.
  4. Insert the `StockTransaction` row.

2. `GET /api/v1/stock/transactions`

- Validation: `stockQuerySchema`
- Controller: `src/controllers/stock.controller.js#getAll`
- Service: `stockService.findAll(query)`
- Prisma behavior:
  - Date range filter uses `where.date.gte/lte`.
  - `lotNo` and `partyName` filter uses `contains` + `mode: 'insensitive'`.
  - Sorting: `date desc`, then `createdAt desc`.
- Returns `{ data, pagination }`.

3. `GET /api/v1/stock/current`

- Controller: `src/controllers/stock.controller.js#getCurrentStock`
- Service: `stockService.getCurrentStock()`
- How it works:
  - `groupBy` by `materialType` + `transactionType` with `_sum.kgs`.
  - For each material, net inflow/outflow.
  - Returns both:
    - `currentStockKg` (3 decimals)
    - `currentStockBags` (derived as `kgs / 60`, 2 decimals)

4. `GET /api/v1/stock/current/:materialType`

- Validation: `materialParamSchema`
- Controller: `src/controllers/stock.controller.js#getCurrentStockByMaterial`
- Service: `stockService.getCurrentStockByMaterial(materialType)`

5. `GET /api/v1/stock/lot-wise`

- Controller: `src/controllers/stock.controller.js#getLotWiseStock`
- Service: `stockService.getLotWiseStock()`
- How it works:
  - `groupBy` by `materialType`, `lotNo`, `transactionType` and sum `kgs` and `bags`.
  - Net inflow/outflow.
  - Returns only lots where `kgs > 0`.

6. `GET /api/v1/stock/party-wise`

- Controller: `src/controllers/stock.controller.js#getPartyWiseStock`
- Service: `stockService.getPartyWiseStock()`
- How it works:
  - Similar to lot-wise, but grouped by `partyName`.
  - Note: unlike lot-wise, it does **not** filter out non-positive values.

7. `GET /api/v1/stock/opening/:date`

- Validation: `dateParamSchema`
- Controller: `src/controllers/stock.controller.js#getOpeningStock`
- Service: `stockService.getOpeningStock(date)`
- Semantics:
  - Opening stock for a day = ledger net of all transactions with `date < requestedDate`.

8. `GET /api/v1/stock/closing/:date`

- Validation: `dateParamSchema`
- Controller: `src/controllers/stock.controller.js#getClosingStock`
- Service: `stockService.getClosingStock(date)`
- Semantics:
  - Closing stock for a day = ledger net of all transactions with `date <= endOfDay(requestedDate)`.

9. `GET /api/v1/stock/transactions/:id`

- Validation: `idParamSchema`
- Controller: `src/controllers/stock.controller.js#getById`
- Service: `stockService.findById(id)`
- If missing: 404

10. `PUT /api/v1/stock/transactions/:id`

- Validation: `idParamSchema` + `updateStockTransactionSchema`
- Controller: `src/controllers/stock.controller.js#update`
- Service: `stockService.update(id, data)`
- Important recomputations:
  - If `bags` changes: recompute `kgs`.
  - If `pricePerBag` changes: recompute `totalPrice`.
  - Edge case: `pricePerBag = 0` is treated as falsy in the current code, resulting in `totalPrice = null`.

11. `DELETE /api/v1/stock/transactions/:id`

- Validation: `idParamSchema`
- Controller: `src/controllers/stock.controller.js#remove`
- Service: `stockService.remove(id)`
- If missing: 404

### Packing

Route file: `src/routes/packing.routes.js`  
Service: `src/services/packing.service.js`

#### Data stored

Writes to `PackingEntry`.

Packing stores both:

- `bags` (as entered)
- `kgs` (derived as bags × 60 at write time)

It also stores:

- `source`: `AUTOCORNER` or `PRODUCTION`
- `yarnType`: a free-text label (not an enum)
- `lotNo`: batch identifier

#### Validation schemas (Zod)

Defined in `src/validators/packing.validator.js`.

- **Body (create)**: `createPackingSchema`
  - `date`: `YYYY-MM-DD`
  - `source`: `AUTOCORNER | PRODUCTION`
  - `yarnType`: string 1..100
  - `bags`: number > 0
  - `lotNo`: string 1..100
  - `remarks`: optional/nullable string max 500
- **Body (update)**: `updatePackingSchema` = partial
- **Query (list)**: `packingQuerySchema`
  - `startDate`, `endDate`: optional `YYYY-MM-DD`
  - `source`: optional enum
  - `lotNo`: optional string
  - `page`, `limit`: optional strings → ints (`limit <= 100`)
- **Params**:
  - `idParamSchema`: `{ id: uuid }`

#### Endpoints

1. `POST /api/v1/packing`

- Validation: `createPackingSchema`
- Controller: `src/controllers/packing.controller.js#create`
- Service: `packingService.create(data)`
- DB operations:
  - Computes `kgs = bagToKg(bags)` then inserts into `packingEntry.create(...)`.

2. `GET /api/v1/packing`

- Validation: `packingQuerySchema`
- Controller: `src/controllers/packing.controller.js#getAll`
- Service: `packingService.findAll(query)`
- Prisma behavior:
  - Optional date range filters.
  - Optional `source` filter.
  - Optional `lotNo contains` (case-insensitive).
  - Sorting: `date desc`, then `createdAt desc`.

3. `GET /api/v1/packing/:id`

- Validation: `idParamSchema`
- Service: `packingService.findById(id)` → 404 if missing.

4. `PUT /api/v1/packing/:id`

- Validation: `idParamSchema` + `updatePackingSchema`
- Service: `packingService.update(id, data)`
- Important recomputation:
  - If `bags` changes → recompute `kgs`.

5. `DELETE /api/v1/packing/:id`

- Validation: `idParamSchema`
- Service: `packingService.remove(id)` → 404 if missing.

#### Important: packing vs stock

Requirements state packing should “update stock” and “feed dispatch”.

In current backend implementation:

- Packing entries are stored.
- **No StockTransaction is auto-created**.

So if stock of YARN must increase based on packing, that must currently happen via:

- separate explicit stock transactions (e.g., POST /stock/transactions with materialType=YARN and type=PURCHASE/RETURN), OR
- future enhancement.

Additional note for future integration discussions:

- `PackingEntry` includes `yarnType`, but `StockTransaction` does **not**.
- If yarn type is important to inventory reporting, the stock schema would need to be extended or normalized.

### Dispatch

Route file: `src/routes/dispatch.routes.js`  
Service: `src/services/dispatch.service.js`

#### Data stored

Writes to `DispatchEntry` and also **auto-writes to StockTransaction**.

On create, Dispatch writes two tables:

- `dispatch_entries` (the dispatch record)
- `stock_transactions` (a ledger row with `transactionType = DISPATCH`)

Both store `bags` and computed `kgs` (bags × 60).

#### Validation schemas (Zod)

Defined in `src/validators/dispatch.validator.js`.

- **Body (create)**: `createDispatchSchema`
  - `date`: `YYYY-MM-DD`
  - `materialType`: enum `COTTON | VISCOSE | FIBER | EXCEL | YARN | WASTE`
  - `lotNo`: string 1..100
  - `partyName`: string 1..200
  - `bags`: number > 0
  - `pricePerBag`: optional/nullable number >= 0
  - `remarks`: optional/nullable string max 500
- **Body (update)**: `updateDispatchSchema` = partial
- **Query (list)**: `dispatchQuerySchema`
  - `startDate`, `endDate`: optional `YYYY-MM-DD`
  - `materialType`: optional enum
  - `lotNo`, `partyName`: optional strings
  - `page`, `limit`: optional strings → ints (`limit <= 100`)
- **Params**:
  - `idParamSchema`: `{ id: uuid }`

#### Endpoints

1. `POST /api/v1/dispatch`

- Validation: `createDispatchSchema`
- Controller: `src/controllers/dispatch.controller.js#create`
- Service: `dispatchService.create(data)`
- Computations:
  - `kgs = bagToKg(bags)`
  - `totalPrice = bags * pricePerBag` (rounded to 2 decimals)
  - Edge case: `pricePerBag = 0` is falsy in the current code and will produce `totalPrice = null`.
- Atomic DB behavior:
  - Uses `prisma.$transaction(...)` so the dispatch row and its stock ledger row are created together.
- Inside the transaction:
  1. **Stock check** for the given `materialType`:
     - `groupBy` stock transactions by `transactionType` for that material.
     - Net inflows/outflows using `INFLOW_TYPES`.
     - If stock is insufficient → throw **400**.
  2. Create `DispatchEntry`.
  3. Create matching `StockTransaction` with:
     - `transactionType: 'DISPATCH'`
     - `remarks: 'Auto-created from dispatch <dispatchId>'`

2. `GET /api/v1/dispatch`

- Validation: `dispatchQuerySchema`
- Controller: `src/controllers/dispatch.controller.js#getAll`
- Service: `dispatchService.findAll(query)`
- Prisma behavior:
  - Optional date range filter.
  - Optional materialType filter.
  - Optional `lotNo` / `partyName` partial-match (case-insensitive).
  - Sorting: `date desc`, then `createdAt desc`.

3. `GET /api/v1/dispatch/:id`

- Validation: `idParamSchema`
- Service: `dispatchService.findById(id)` → 404 if missing.

4. `PUT /api/v1/dispatch/:id`

- Validation: `idParamSchema` + `updateDispatchSchema`
- Service: `dispatchService.update(id, data)`
- Recomputations:
  - If `bags` changes: recompute `kgs`.
  - If `pricePerBag` changes: recompute `totalPrice`.
- Important: this updates **only** the dispatch record, not the stock ledger entry.

5. `DELETE /api/v1/dispatch/:id`

- Validation: `idParamSchema`
- Service: `dispatchService.remove(id)`
- Important: this deletes **only** the dispatch record, not the stock ledger entry.

#### Important consistency note

Only **dispatch creation** auto-creates a stock transaction.

Dispatch update/delete endpoints **do not update/delete the corresponding stock transaction**, because no relationship is stored to find it later.

That means:

- If you edit a dispatch record (bags/date/material), inventory ledger may become inconsistent.
- If you delete a dispatch record, the stock transaction remains.

If your client asks about this: explain that dispatch should ideally store a reference to the stock transaction ID or use a foreign-key relation.

#### Implementation notes

In `src/services/dispatch.service.js`, there are imports that are currently unused (`BAG_TO_KG` and `stockService`). This does not change runtime behavior, but it’s useful to know when discussing maintainability.

### EB

Route file: `src/routes/eb.routes.js`  
Service: `src/services/eb.service.js`

#### Data stored

Writes to `EBEntry`.

EB entries represent **monthly** meter readings:

- `openingUnits`
- `closingUnits`

Derived value (not stored):

- `ebUnitsConsumed = closingUnits - openingUnits`

Uniqueness:

- Only one row per `(month, year)`.

#### Validation schemas (Zod)

Defined in `src/validators/eb.validator.js`.

- **Body (create/update base)**: `baseEBSchema`
  - `month`: int 1..12
  - `year`: int 2000..2100
  - `openingUnits`: number >= 0
  - `closingUnits`: number >= 0
- **Body (create)**: `createEBSchema`
  - Adds rule: `closingUnits >= openingUnits`
- **Body (update)**: `updateEBSchema` = partial
- **Query (list)**: `ebQuerySchema`
  - `year`: optional string → int 2000..2100
  - `page`, `limit`: optional strings → ints (`limit <= 100`)
- **Params**:
  - `idParamSchema`: `{ id: uuid }`
  - `monthYearParamSchema`: `{ year: string→int, month: string→int }`

#### Endpoints

1. `POST /api/v1/eb`

- Validation: `createEBSchema`
- Controller: `src/controllers/eb.controller.js#create`
- Service: `ebService.create(data)`
- DB operations:
  - Duplicate check: `eBEntry.findUnique({ where: { month_year: { month, year }}})`
  - Insert: `eBEntry.create({ data: { month, year, openingUnits, closingUnits }})`
- Response:
  - Returns stored fields plus `calculated.ebUnitsConsumed`.
- Error cases:
  - **409** if month/year already exists

2. `GET /api/v1/eb`

- Validation: `ebQuerySchema`
- Controller: `src/controllers/eb.controller.js#getAll`
- Service: `ebService.findAll(query)`
- Prisma behavior:
  - Optional `where.year = year`
  - Sorting: `year desc`, `month desc`
  - Pagination with `skip/take`
- Response:
  - `{ data: EBEntryWithCalculated[], pagination }`

3. `GET /api/v1/eb/month/:year/:month`

- Validation: `monthYearParamSchema`
- Controller: `src/controllers/eb.controller.js#getByMonthYear`
- Service: `ebService.findByMonthYear(month, year)`
- DB operations:
  - `eBEntry.findUnique({ where: { month_year: { month, year }}})`
- If missing: 404

4. `GET /api/v1/eb/:id`

- Validation: `idParamSchema`
- Service: `ebService.findById(id)` → 404 if missing.

5. `PUT /api/v1/eb/:id`

- Validation: `idParamSchema` + `updateEBSchema`
- Service: `ebService.update(id, data)`
- Conflict prevention:
  - If `month` or `year` changes, it checks that the new `(month,year)` doesn’t collide.

6. `DELETE /api/v1/eb/:id`

- Validation: `idParamSchema`
- Service: `ebService.remove(id)` → 404 if missing.

#### Calculated output

EB endpoints return:

- `calculated.ebUnitsConsumed`

### Dashboard / Reports

Route file: `src/routes/dashboard.routes.js`  
Service: `src/services/dashboard.service.js`

Dashboards are “read-only” computations. They read raw data from Production/Stock/EB and compute metrics.

#### Important characteristics

- These endpoints do **not** store derived/report tables; everything is computed on demand.
- Dashboard routes currently do **not** use the Zod `validate(...)` middleware.
  - The controllers parse numeric params using `parseInt(...)`.
  - If `year/month/date` are invalid, the service may throw and you may see a **500**.

#### Endpoints

1. `GET /api/v1/dashboard/daily/:date`

- Controller: `src/controllers/dashboard.controller.js#getDailySummary`
- Service: `dashboardService.getDailySummary(date)`
- DB reads:
  - `productionEntry.findMany({ where: { date: new Date(date) }, orderBy: { frameNumber: 'asc' } })`
- Calculations per frame:
  - spinning loss kg/%
  - autocorner loss kg/%
  - UKG
  - GPS
- Totals:
  - If there is at least 1 frame entry, totals are computed by summing:
    - productionKg, autocornerProductionKg, packingKg, ebUnits, and spindles
  - Derived metrics are computed again on totals.
- Response:
  - `{ date, frames, totals }`

2. `GET /api/v1/dashboard/monthly/:year/:month`

- Controller: `src/controllers/dashboard.controller.js#getMonthlySummary`
- Inputs:
  - `year = parseInt(req.params.year)`
  - `month = parseInt(req.params.month)` (expected 1..12)
- Service: `dashboardService.getMonthlySummary(year, month)`

Date range construction:

- `startDate = new Date(year, month - 1, 1)`
- `endDate = new Date(year, month, 0)` (last day of the month)

DB reads (all within the month range):

1. Production rows:

- `productionEntry.findMany({ where: { date: { gte: startDate, lte: endDate }}})`

2. Raw material issues (cotton issue inputs):

- `stockTransaction.findMany({ where: { date: { gte, lte }, transactionType: 'ISSUE' }})`
- Service then groups these by `materialType` and only sums these keys:
  - cotton, fiber, viscose, excel

3. Waste transactions:

- `stockTransaction.findMany({ where: { date: { gte, lte }, materialType: 'WASTE' }})`
- Net waste uses inflow/outflow logic:
  - If txn type is inflow → add
  - If outflow → subtract

4. Monthly EB entry:

- `eBEntry.findUnique({ where: { month_year: { month, year }}})`
- If present:
  - `ebUnitsConsumed = closingUnits - openingUnits`
- If missing:
  - EB units are treated as 0

Derived metrics computed:

- Total production/autocorner/packing = sum across production rows
- Frame-wise production totals:
  - sum production where `frameNumber === 'FRAME_41'`
  - sum production where `frameNumber === 'FRAME_47'`
- `cottonIssue = cotton + fiber + viscose + excel`
- `yarnRealisation% = production / cottonIssue × 100`
- `waste% = waste / cottonIssue × 100`
- `invisibleLoss% = 100 - realisation - waste`
- `monthlyUKG = ebUnits / totalProduction`

Response shape:

- `{ year, month, production: {...}, rawMaterials: {...}, metrics: {...}, energy: {...} }`

Formatting notes:

- Many outputs use `.toFixed(...)` (strings).
- `daysRecorded` is computed as the number of unique production entry dates present in the month.

3. `GET /api/v1/dashboard/yearly/:year`

- Controller: `src/controllers/dashboard.controller.js#getYearlySummary`
- Service: `dashboardService.getYearlySummary(year)`
- Behavior:
  - Loops `month = 1..12` and calls `getMonthlySummary(year, month)`.
  - If a month computation throws, it inserts a placeholder object for that month.
  - Yearly totals currently only include total production kg.

4. `GET /api/v1/dashboard/stock`

- Controller: `src/controllers/dashboard.controller.js#getStockDashboard`
- Service: `dashboardService.getStockDashboard()`
- DB reads:
  - Current stock summary:
    - `stockTransaction.groupBy({ by: ['materialType','transactionType'], _sum: { kgs: true, bags: true }})`
    - Net inflow/outflow
  - Lot-wise summary:
    - `stockTransaction.groupBy({ by: ['materialType','lotNo','transactionType'], _sum: { kgs: true }})`
    - Net inflow/outflow, then filter `kgs > 0`
  - Recent transactions:
    - `stockTransaction.findMany({ orderBy: [{ date: 'desc' }, { createdAt: 'desc' }], take: 20 })`

#### Report data sources (quick cheat-sheet)

- Daily dashboard energy uses **ProductionEntry.ebUnits** (daily units per entry).
- Monthly dashboard energy uses **EBEntry** (monthly meter delta).
- Monthly cotton issue uses **only** `StockTransaction` rows with `transactionType = ISSUE`.
- Monthly waste uses **only** `StockTransaction` rows where `materialType = WASTE` (netted by inflow/outflow).

---

## End-to-end data flow (client → API → DB → reports)

Below is how data moves through the system.

### Client modules → endpoints → tables

This mapping is based on the workflow described in `Requirements.MD`.

| Client feature (typical) | Backend endpoints used                       | Tables written                           | Tables read                                              | Notes                                                   |
| ------------------------ | -------------------------------------------- | ---------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------- |
| Mobile: Production Entry | `POST /api/v1/production`                    | `production_entries`                     | —                                                        | Stored per date+frame, derived metrics computed on read |
| Mobile: Stock Entry      | `POST /api/v1/stock/transactions`            | `stock_transactions`                     | `stock_transactions` (outflow check)                     | Prevents negative stock for ISSUE/DISPATCH              |
| Mobile: Packing Entry    | `POST /api/v1/packing`                       | `packing_entries`                        | —                                                        | Does not auto-update stock ledger in current code       |
| Mobile: Dispatch Entry   | `POST /api/v1/dispatch`                      | `dispatch_entries`, `stock_transactions` | `stock_transactions` (stock check)                       | Uses DB transaction to ensure both rows are created     |
| Mobile: EB Entry         | `POST /api/v1/eb`                            | `eb_entries`                             | —                                                        | Monthly readings; consumption is derived on read        |
| Web: Daily Dashboard     | `GET /api/v1/dashboard/daily/:date`          | —                                        | `production_entries`                                     | Uses per-entry ebUnits (daily)                          |
| Web: Monthly Dashboard   | `GET /api/v1/dashboard/monthly/:year/:month` | —                                        | `production_entries`, `stock_transactions`, `eb_entries` | Uses monthly EB meter delta                             |
| Web: Yearly Dashboard    | `GET /api/v1/dashboard/yearly/:year`         | —                                        | same as monthly                                          | Builds 12 monthly summaries                             |
| Web: Stock Dashboard     | `GET /api/v1/dashboard/stock`                | —                                        | `stock_transactions`                                     | Returns current, lot-wise, and recent transactions      |
| Web/Mobile: Logs & lists | `GET` list endpoints in each module          | —                                        | respective tables                                        | All list endpoints support pagination                   |

### Layering pattern (applies to all modules)

**Client → Route → Validate → Controller → Service → Prisma → DB → Service → Controller → JSON**

- Routes define the URL, HTTP method, and validation middleware.
- Validators (Zod) enforce shape and business rules.
- Controllers translate HTTP to service calls and wrap the response.
- Services contain business logic and DB reads/writes.

### Flow A — Production entry to dashboards

1. Client sends `POST /api/v1/production` with numeric kg values and spindles.
2. Service stores a `ProductionEntry`.
3. When client requests:
   - Daily production: `GET /production/daily/:date` OR `GET /dashboard/daily/:date`
   - Monthly dashboard: `GET /dashboard/monthly/:year/:month`
4. Backend reads production rows and computes losses/UKG/GPS dynamically.

### Flow B — Stock ledger to stock dashboards

1. Client records stock events using `POST /api/v1/stock/transactions`.
2. Backend stores a transaction row with both `bags` and computed `kgs`.
3. “Current stock” endpoints aggregate transactions using inflow/outflow rules.

### Flow C — Dispatch reduces stock (automatic ledger entry)

1. Client sends `POST /api/v1/dispatch`.
2. Service checks if there is enough stock for that material.
3. Service writes:
   - `DispatchEntry`
   - `StockTransaction` with `transactionType=DISPATCH`

This is currently the only place where one module auto-writes into another module’s table.

### Flow D — Monthly EB readings to monthly UKG

1. Client sends `POST /api/v1/eb` (month/year/opening/closing units).
2. Backend derives `ebUnitsConsumed = closing - opening` on reads.
3. Monthly dashboard reads EBEntry for the month and computes `UKG = EB Units / Total Production`.

### Flow E — Monthly costing / invisible loss

Monthly dashboard combines:

- Total production from ProductionEntry
- Cotton issue from StockTransaction where transactionType=ISSUE and materialType in {COTTON,FIBER,VISCOSE,EXCEL}
- Waste from StockTransaction where materialType=WASTE (net)

Then computes:

- Realisation% = Production / CottonIssue
- Waste% = Waste / CottonIssue
- InvisibleLoss% = 100 - Realisation - Waste

---

## Known gaps / gotchas / client-facing FAQs

### 1) Packing does not update stock (yet)

- Requirements say packing should update stock.
- Backend currently stores PackingEntry but does not auto-create a StockTransaction.

If the client expects yarn stock to increase on packing entry, that is not happening automatically.

### 2) Dispatch creates a stock transaction only on create

- Create dispatch = creates a DISPATCH ledger transaction.
- Update/delete dispatch = does NOT update/delete that ledger row.

This can cause stock inconsistencies if dispatches are edited after creation.

### 3) Auth exists as a placeholder

- `src/middleware/auth.js` is currently a stub and is not mounted.
- All endpoints are effectively public (subject to CORS/network controls).

### 4) CORS is wide open

- `origin: '*'` in `src/app.js`.

### 5) Seed script referenced but missing

`backend/package.json` contains:

- `db:seed`: `node prisma/seed.js`

But `prisma/seed.js` is not present in this workspace.

### 6) Decimal output types

- Prisma Decimal values may serialize as strings.
- Many calculated fields are explicitly stringified using `.toFixed(...)`.

If your client asks “why is this a string?”: it is due to decimal precision handling.

### 7) Requirements vs code: Realisation% formula

Backend uses `Production / CottonIssue × 100`.

If you want the alternate formula, you would need to change `yarnRealisationPercent()`.

### 8) Dashboard routes don’t validate params

Unlike module CRUD routes, the dashboard routes do not run through the Zod `validate(...)` middleware.

Implications:

- If `:year/:month/:date` are malformed, you may get 500 errors instead of clean 400 validation errors.

### 9) Potential timezone/date edge cases

The backend uses `new Date('YYYY-MM-DD')` in multiple places.

- JS parses that string as UTC midnight.
- Some computations (like end-of-day) use local-time operations (`setHours(...)`).

If server timezone differs from the business timezone, you can see subtle date boundary issues in filters.

### 10) `pricePerBag = 0` makes `totalPrice` become null

Stock and Dispatch services compute totalPrice with a truthy check:

- If `pricePerBag` is `0`, code treats it as “missing” and sets `totalPrice = null`.

If your client expects `0`, this needs a small code adjustment (use explicit null/undefined checks).

### 11) Delete responses are not fully standardized

Most endpoints return the `ApiResponse` envelope.

- Delete endpoints return `{ success: true, message: '...' }` directly.

If a frontend assumes `statusCode/data/message` always exist, delete calls may require special handling.

### 12) Calculations duplicated in multiple places

Daily production calculations appear in:

- `src/services/production.service.js` (enriching production entries)
- `src/services/dashboard.service.js` (daily dashboard)

Both use the same underlying functions from `src/utils/calculations.js`, but the aggregation rules differ (e.g., totals computed when both frames exist vs any frames). When explaining to a client, describe which endpoint they’re using and why totals may differ.

---

## Appendix: Example requests/responses

> These are representative examples based on validators and service logic.

### Create Production Entry

`POST /api/v1/production`

```json
{
  "date": "2026-03-31",
  "frameNumber": "FRAME_41",
  "productionKg": 12500.0,
  "autocornerProductionKg": 12100.0,
  "packingKg": 11950.0,
  "ebUnits": 850.0,
  "noOfSpindles": 1200,
  "remarks": "Normal running"
}
```

Response includes:

- saved entry
- `calculated.spinningLossKg`, `calculated.ukg`, etc.

### Create Stock Transaction

`POST /api/v1/stock/transactions`

```json
{
  "date": "2026-03-31",
  "materialType": "COTTON",
  "transactionType": "PURCHASE",
  "lotNo": "LOT-001",
  "partyName": "Supplier A",
  "bags": 10,
  "pricePerBag": 5000,
  "remarks": "New purchase"
}
```

### Create Dispatch (auto creates stock DISPATCH)

`POST /api/v1/dispatch`

```json
{
  "date": "2026-03-31",
  "materialType": "YARN",
  "lotNo": "YARN-LOT-77",
  "partyName": "Customer X",
  "bags": 5,
  "pricePerBag": 7200,
  "remarks": "Invoice #123"
}
```

### Monthly Dashboard

`GET /api/v1/dashboard/monthly/2026/3`

Response includes:

- production totals and losses
- cotton issue by raw material
- yarn realisation %, waste %, invisible loss
- EB units consumed and UKG
