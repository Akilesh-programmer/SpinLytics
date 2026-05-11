# SpinLytics — Complete Startup Guide

> Everything you need to start, run, seed, and demo the SpinLytics system.

---

## Prerequisites

| Tool       | Version | Check            | Install                             |
| ---------- | ------- | ---------------- | ----------------------------------- |
| Node.js    | v18+    | `node -v`        | https://nodejs.org                  |
| npm        | v9+     | `npm -v`         | (bundled with Node.js)              |
| PostgreSQL | v14+    | `psql --version` | https://www.postgresql.org/download |

---

## Project Structure

```
SpinLytics/
├── backend/          ← Node.js + Express + Prisma API (port 5000)
├── frontend/         ← React (Vite) web app (port 5173)
└── app/              ← React Native mobile app (not used for demo)
```

---

## One-Time Setup (First Run Only)

### 1. Install Dependencies

Open **two terminals** — one in `backend/`, one in `frontend/`.

```powershell
# Terminal 1 — Backend
cd D:\SpinLytics\backend
npm install

# Terminal 2 — Frontend
cd D:\SpinLytics\frontend
npm install
```

### 2. Configure the Database

Create a `.env` file in `D:\SpinLytics\backend\`:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/spinlytics"
NODE_ENV=development
PORT=5000
```

> Replace `YOUR_PASSWORD` with your PostgreSQL password.
> Create the `spinlytics` database first if it doesn't exist:
>
> ```sql
> -- In psql or pgAdmin:
> CREATE DATABASE spinlytics;
> ```

### 3. Push the Database Schema

```powershell
cd D:\SpinLytics\backend
npx prisma db push
```

> This creates all tables in your PostgreSQL database to match the Prisma schema.

### 4. Generate the Prisma Client

```powershell
cd D:\SpinLytics\backend
npx prisma generate
```

> Note: If the server is running, stop it first (the DLL will be locked).

### 5. Seed the Database with Demo Data

```powershell
cd D:\SpinLytics\backend
node prisma/seed.js
```

This loads **3 months of realistic demo data** (March–May 2026):

- 360 shift production entries (60 working days × 6 rows/day)
- 60 stock transactions (purchases, issues, waste, YARN)
- 17 packing entries
- 9 dispatch entries (with linked stock transactions)
- 5 EB electricity entries (January–May 2026)

---

## Starting the Project (Every Time)

### Step 1 — Start the Backend

```powershell
cd D:\SpinLytics\backend
npm run dev
```

You should see:

```
✅ Database connected successfully
🏭 SpinLytics API Server
   Port: 5000
   URL:  http://localhost:5000
```

> **On Windows**, if you get `running scripts is disabled`, run this first:
>
> ```powershell
> Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
> ```
>
> Then re-run `npm run dev`.

### Step 2 — Start the Frontend

Open a **second terminal**:

```powershell
cd D:\SpinLytics\frontend
npm run dev
```

You should see:

```
  VITE v6.x  ready in Xms
  ➜  Local:   http://localhost:5173/
```

### Step 3 — Open the App

Navigate to **http://localhost:5173** in your browser.

---

## Demo Navigation Guide

The demo data covers **March 1 – May 10, 2026** (today). Use these paths to show each feature:

### Daily Dashboard

- Go to **Daily Dashboard** → select **May 10, 2026**
- Shows: 6 production entries, count comparison (41s vs 47s), efficiency metrics
- Try also: May 5, 7, or any earlier date

### Monthly Dashboard

- Go to **Monthly Dashboard** → select **May 2026**
- Shows: Production totals, Cotton Issue, Yarn Realisation %, UKG, EB units
- Try also: **April 2026** and **March 2026** for comparison

### Yearly Dashboard

- Go to **Yearly Dashboard** → select **2026**
- Shows: 5-month trend, annual KPIs, monthly breakdown table

### Stock Dashboard

- Shows current live stock per material with lot breakdown
- COTTON, FIBER, VISCOSE, EXCEL, YARN, WASTE all have activity

### Production Log

- Browse all 360 shift production entries
- Filter by date range: March–May 2026

### Dispatch Log

- 9 dispatches to 5 buyers across March–May 2026
- Vinayaga Mills, Sri Lakshmi Textiles, KPR Mill Ltd, Ramco Yarns, Coats India Ltd

### Packing Log

- 17 packing entries (AUTOCORNER and PRODUCTION sources)

### Energy (EB) Log

- 5 months of electricity data (Jan–May 2026)
- UKG trend visible on Monthly dashboard

---

## Available npm Scripts

### Backend (`D:\SpinLytics\backend`)

| Command               | What it does                                  |
| --------------------- | --------------------------------------------- |
| `npm run dev`         | Start backend with hot reload (nodemon)       |
| `npm run start`       | Start backend (production, no hot reload)     |
| `npm run db:push`     | Push Prisma schema changes to database        |
| `npm run db:generate` | Regenerate Prisma client after schema changes |
| `npm run db:seed`     | Run the demo seed script                      |
| `npm run db:studio`   | Open Prisma Studio (visual DB browser)        |

### Frontend (`D:\SpinLytics\frontend`)

| Command           | What it does                              |
| ----------------- | ----------------------------------------- |
| `npm run dev`     | Start Vite dev server (hot reload)        |
| `npm run build`   | Build for production (outputs to `dist/`) |
| `npm run preview` | Preview the production build locally      |

---

## API Health Check

Once the backend is running, verify it's working:

```powershell
# Health check
Invoke-RestMethod http://localhost:5000/api/v1/health

# Test daily dashboard (May 10, 2026)
Invoke-RestMethod http://localhost:5000/api/v1/dashboard/daily/2026-05-10

# Test monthly dashboard (May 2026)
Invoke-RestMethod http://localhost:5000/api/v1/dashboard/monthly/2026/5

# Check current stock
Invoke-RestMethod http://localhost:5000/api/v1/stock/current
```

---

## Troubleshooting

### "Cannot find module '@prisma/client'"

```powershell
cd D:\SpinLytics\backend
npm install
npx prisma generate
```

### "The table does not exist in the current database"

```powershell
cd D:\SpinLytics\backend
npx prisma db push
```

### "EPERM: operation not permitted" during prisma generate

The Node server is holding the DLL. Stop it first:

```powershell
Get-Process node | Stop-Process -Force
npx prisma generate
```

### "Running scripts is disabled on this system" (Windows)

```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
```

### Port already in use (5000 or 5173)

```powershell
# Find and kill the process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Re-seeding the database (fresh demo data)

```powershell
cd D:\SpinLytics\backend
node prisma/seed.js
```

> This **clears all existing data** and re-seeds from scratch.

---

## Key URLs

| URL                                                     | Description           |
| ------------------------------------------------------- | --------------------- |
| http://localhost:5173                                   | Frontend web app      |
| http://localhost:5000/api/v1/health                     | Backend health check  |
| http://localhost:5000/api/v1/dashboard/daily/2026-05-10 | Daily dashboard API   |
| http://localhost:5000/api/v1/dashboard/monthly/2026/5   | Monthly dashboard API |
| http://localhost:5000/api/v1/dashboard/yearly/2026      | Yearly dashboard API  |
| http://localhost:5000/api/v1/stock/current              | Current stock API     |

---

## Database: Lot Reference (Demo Data)

| Lot ID       | Material | Supplier            | Bags Purchased |
| ------------ | -------- | ------------------- | -------------- |
| LOT-2026-C01 | COTTON   | Prem Cotton Traders | 80             |
| LOT-2026-C02 | COTTON   | Prem Cotton Traders | 90             |
| LOT-2026-C03 | COTTON   | Prem Cotton Traders | 100            |
| LOT-2026-F01 | FIBER    | Fibre King Pvt Ltd  | 75 total       |
| LOT-2026-V01 | VISCOSE  | Indo Viscose Ltd    | 25             |
| LOT-2026-V02 | VISCOSE  | Indo Viscose Ltd    | 35             |
| LOT-2026-E01 | EXCEL    | Excel Fibre Co.     | 37 total       |
| LOT-2026-Y01 | YARN     | Autocorner Floor    | 20             |
| LOT-2026-Y02 | YARN     | Autocorner Floor    | 25             |
| LOT-2026-Y03 | YARN     | Autocorner Floor    | 15             |
