# 📘 SpinLytics — DEEP CLIENT EXPLANATION (2026 Standard)

> A complete, developer-level reference for how the SpinLytics textile ERP system works — from data entry to dashboard reports.

---

## Part 1: What This System Does

SpinLytics is a **production analytics and inventory management system** for a textile (yarn spinning) mill. It replaces Excel-based record-keeping with a web-based application that:

1. **Captures shift-level production data** through a spreadsheet-style web entry page
2. **Automatically calculates** 6 key production metrics per entry in real-time
3. **Tracks inventory** (raw materials, yarn, waste) using a transaction-based stock system
4. **Records packing, dispatch, and electricity** consumption
5. **Generates reports** — Daily, Monthly, and Yearly dashboards with derived KPIs

### The Core Principle

> **Derived values are NEVER stored in the database.**

All calculations (Production Kgs, Efficiency %, Waste %, Grams per Spindle, Yarn Realisation, UKG, etc.) are computed dynamically at query time. The database only stores raw input values.

---

## Part 2: System Architecture

### Components

| Component    | Technology              | Purpose                              |
| ------------ | ----------------------- | ------------------------------------ |
| **Web App**  | React (Vite)            | Data Entry Pages + Dashboard Reports |
| **Backend**  | Node.js + Express       | REST API, Business Logic, Validation |
| **Database** | PostgreSQL (Prisma ORM) | Persistent storage of raw entries    |

### Architecture Diagram

```
┌──────────────────────────────────────────────────────┐
│                    WEB DASHBOARD                      │
│                                                      │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │ Data Entry   │  │  Dashboards  │  │   Records  │  │
│  │ • Production │  │  • Daily     │  │ • Prod Log │  │
│  │ • Stock      │  │  • Monthly   │  │ • Pack Log │  │
│  │ • Packing    │  │  • Yearly    │  │ • Disp Log │  │
│  │ • Dispatch   │  │  • Stock     │  │ • EB Log   │  │
│  │ • EB Entry   │  │              │  │            │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬─────┘  │
│         │                 │                 │         │
│         └────────┬────────┘────────┬────────┘         │
│                  │    REST API     │                   │
└──────────────────┼────────────────┼───────────────────┘
                   │                │
┌──────────────────┼────────────────┼───────────────────┐
│                  ▼   BACKEND      ▼                   │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Controllers → Services → Calculations          │  │
│  │  Validators (Zod)  │  Prisma ORM                │  │
│  └─────────────────────┼───────────────────────────┘  │
│                        │                              │
│                        ▼                              │
│              ┌──────────────────┐                     │
│              │   PostgreSQL DB  │                     │
│              │  • shift_prod    │                     │
│              │  • stock_txns    │                     │
│              │  • packing       │                     │
│              │  • dispatch      │                     │
│              │  • eb_entries    │                     │
│              └──────────────────┘                     │
└───────────────────────────────────────────────────────┘
```

---

## Part 3: The 5 Data Entry Pages

All data entry happens through web pages in the dashboard. There is no mobile app.

### Entry Page 1: Production Entry (The Main Event)

This is the primary data entry page — a **spreadsheet-style shift production sheet**.

**Layout:**

```
┌──────────────────────────────────────────────────────────┐
│  SESSION SETTINGS                                         │
│  Date: [2026-05-10]  Shift Hrs: [12]  Spindles: [1728]   │
├──────────────────────────────────────────────────────────┤
│  # │ R/F │ Sider │ Count │ STD  │ STD  │ Act  │ Run │ ...│
│    │ No. │ Name  │       │ Const│ HK   │ HK   │ Hrs │    │
│────┼─────┼───────┼───────┼──────┼──────┼──────┼─────┼────│
│  1 │RF-1 │ Kumar │ 41s   │0.0023│680.0 │650.2 │11.5 │ ...│
│  2 │RF-2 │ Raju  │ 47s   │0.0019│720.0 │700.1 │11.8 │ ...│
│  3 │RF-3 │ Mohan │ 41s   │0.0023│680.0 │660.3 │11.2 │ ...│
├──────────────────────────────────────────────────────────┤
│  [+ Add Row]  [Clear All]        [Save All (3 unsaved)]  │
└──────────────────────────────────────────────────────────┘
```

**Session Settings** (set once per shift, shared across all rows):

- **Date** — the production date
- **Shift Hours** — 8 or 12 hours
- **Total Spindles per Machine** — 1152 (standard) or 1728 (large)

**Manual Input Columns** (per row):
| Column | Type | Description |
|---|---|---|
| R/F No. | String | Ring Frame machine identifier (RF-1, RF-2, etc.) |
| Sider Name | String | Operator name |
| Count | String | Material count — **this IS the frame identifier** (41s, 47s, etc.) |
| STD Constant | Float | Standard production constant for this count |
| STD HK | Float | Standard expected Hanks (benchmark) |
| Actual HK | Float | Actual Hanks produced |
| Run Hrs | Float | Machine running hours |
| Idle Spindles | Int | Number of inactive spindles (default 0) |
| Waste Kgs | Float | Waste generated in kg |
| Stoppages | String | Optional reason/duration of stoppages |

**Auto-Calculated Columns** (per row, computed in real-time):

| #   | Metric                  | Formula                                | Example                           |
| --- | ----------------------- | -------------------------------------- | --------------------------------- |
| 1   | Production Kgs (Gross)  | `Actual HK × STD Constant`             | 650.2 × 0.0023 = 1.496 kg         |
| 2   | Actual Production (Net) | `Gross Kgs − Waste Kgs`                | 1.496 − 0.05 = 1.446 kg           |
| 3   | Waste %                 | `(Waste / Gross) × 100`                | (0.05 / 1.496) × 100 = 3.34%      |
| 4   | Worked Spindles         | `(Total − Idle) × (RunHrs / ShiftHrs)` | (1728 − 0) × (11.5 / 12) = 1656.0 |
| 5   | Grams/Spindle           | `(Net × 1000) / Worked Spindles`       | (1.446 × 1000) / 1656 = 0.873     |
| 6   | Efficiency %            | `(Actual HK / STD HK) × 100`           | (650.2 / 680.0) × 100 = 95.62%    |

**Save Modes:**

- **Individual Save**: Click the save icon on any row to save just that row
- **Batch Save All**: Click "Save All" to submit all unsaved rows at once (atomic transaction)

### Entry Page 2: Stock Entry

Records stock transactions (purchases, issues, returns).

| Field            | Type   | Notes                                      |
| ---------------- | ------ | ------------------------------------------ |
| Date             | Date   | Transaction date                           |
| Material Type    | Enum   | COTTON, VISCOSE, FIBER, EXCEL, YARN, WASTE |
| Transaction Type | Enum   | PURCHASE, ISSUE, RETURN                    |
| Lot No.          | String | Lot identifier                             |
| Party Name       | String | Supplier/buyer name                        |
| Bags             | Float  | Number of bags                             |
| Price per Bag    | Float  | Optional, in ₹                             |
| Remarks          | String | Optional notes                             |

**Auto-show:** `KG = Bags × 60` and `Total Price = Bags × Price per Bag`

### Entry Page 3: Packing Entry

| Field     | Type   | Notes                    |
| --------- | ------ | ------------------------ |
| Date      | Date   | Packing date             |
| Source    | Enum   | AUTOCORNER or PRODUCTION |
| Yarn Type | String | Type of yarn packed      |
| Bags      | Float  | Number of bags           |
| Lot No.   | String | Lot identifier           |
| Remarks   | String | Optional                 |

### Entry Page 4: Dispatch Entry

| Field         | Type   | Notes                    |
| ------------- | ------ | ------------------------ |
| Date          | Date   | Dispatch date            |
| Material Type | Enum   | What is being dispatched |
| Lot No.       | String | Lot identifier           |
| Party Name    | String | Buyer name               |
| Bags          | Float  | Number of bags           |
| Price per Bag | Float  | Optional, in ₹           |
| Remarks       | String | Optional                 |

**Side effect:** Each dispatch atomically creates a `DISPATCH` stock transaction to reduce inventory.

### Entry Page 5: EB (Electricity) Entry

| Field         | Type  | Notes                                         |
| ------------- | ----- | --------------------------------------------- |
| Month         | Int   | Month number (1-12)                           |
| Year          | Int   | Year (e.g., 2026)                             |
| Opening Units | Float | **Auto-filled** from previous month's closing |
| Closing Units | Float | Manual input                                  |

**Auto-show:** `EB Units Consumed = Closing − Opening`

---

## Part 4: Database Schema

### Table: `production_entries`

> **Note:** The Prisma model is named `ShiftProductionEntry` and the accessor is `prisma.shiftProductionEntry`, but the actual PostgreSQL table name is `production_entries` (set via `@@map("production_entries")` in the schema).

```
id (UUID, PK)
date (DATE)
shiftHours (DECIMAL 4,1)          — e.g. 12.0
totalSpindlesPerMachine (INT)      — e.g. 1728
rfNo (STRING)                      — e.g. "RF-1"
siderName (STRING)                 — e.g. "Kumar"
count (STRING)                     — e.g. "41s" (= FRAME IDENTIFIER)
stdConstant (DECIMAL 12,6)
stdHK (DECIMAL 12,3)
actualHK (DECIMAL 12,3)
runHrs (DECIMAL 4,1)
idleSpindles (INT, default 0)
wasteKgs (DECIMAL 12,3)
stoppages (STRING, nullable)
createdAt, updatedAt
```

**Design:** Session fields (`date`, `shiftHours`, `totalSpindlesPerMachine`) are denormalized into each row. This avoids a separate "session" table and keeps queries simple.

**NOT stored:** Production Kgs, Actual Production, Waste %, Worked Spindles, Grams/Spindle, Efficiency %. All computed at query time.

### Table: `stock_transactions`

```
id (UUID, PK)
date (DATE)
materialType (ENUM)
transactionType (ENUM)
lotNo (STRING)
partyName (STRING)
bags (DECIMAL 10,2)
kgs (DECIMAL 12,3)           — = bags × 60
pricePerBag (DECIMAL 12,2, nullable)
totalPrice (DECIMAL 14,2, nullable)
remarks (STRING, nullable)
createdAt, updatedAt
```

**Stock balance is NEVER stored.** Current stock = `SUM(PURCHASE + RETURN) − SUM(ISSUE + DISPATCH)`.

### Table: `packing_entries`

```
id, date, source (ENUM), yarnType, bags, kgs, lotNo, remarks
```

### Table: `dispatch_entries`

```
id, date, materialType (ENUM), lotNo, partyName, bags, kgs, pricePerBag, totalPrice, remarks
```

### Table: `eb_entries`

```
id, month, year, openingUnits, closingUnits
UNIQUE(month, year)
```

---

## Part 5: Material Types & Transaction Types

### Material Types

| Type    | Description      | Used In                     |
| ------- | ---------------- | --------------------------- |
| COTTON  | Raw cotton       | Stock, Issue → Cotton Issue |
| VISCOSE | Viscose fiber    | Stock, Issue → Cotton Issue |
| FIBER   | Synthetic fiber  | Stock, Issue → Cotton Issue |
| EXCEL   | Excel fiber      | Stock, Issue → Cotton Issue |
| YARN    | Finished yarn    | Stock, Packing, Dispatch    |
| WASTE   | Production waste | Stock                       |

### Transaction Types

| Type     | Effect | Description                     |
| -------- | ------ | ------------------------------- |
| PURCHASE | +Stock | Raw material received           |
| ISSUE    | −Stock | Raw material sent to production |
| DISPATCH | −Stock | Finished goods sent to buyer    |
| RETURN   | +Stock | Material returned               |

### Raw Material Types (for Cotton Issue)

`COTTON + VISCOSE + FIBER + EXCEL` = These 4 types collectively form **"Cotton Issue"** for the Yarn Realisation calculation.

---

## Part 6: Formula Reference (Complete)

### Per-Row Production Formulas (2026 Standard)

These are calculated for **every shift production entry row**:

```
╔═══════════════════════════════════════════════════════════════════╗
║ # │ Formula Name           │ Formula                             ║
╠═══╪════════════════════════╪═════════════════════════════════════╣
║ 1 │ Production Kgs (Gross) │ Actual HK × STD Constant           ║
║ 2 │ Actual Production (Net)│ Production Kgs − Waste Kgs          ║
║ 3 │ Waste %                │ (Waste Kgs / Production Kgs) × 100  ║
║ 4 │ Worked Spindles        │ (Total−Idle) × (RunHrs/ShiftHrs)    ║
║ 5 │ Grams per Spindle      │ (Net Production × 1000) / Wkd Spnl  ║
║ 6 │ Efficiency %           │ (Actual HK / STD HK) × 100         ║
╚═══╧════════════════════════╧═════════════════════════════════════╝
```

### Aggregated Formulas (Daily Totals)

When showing daily totals across all rows:

```
Total Gross Kgs = SUM of all rows' Production Kgs
Total Net Kgs   = SUM of all rows' Actual Production
Total Waste     = SUM of all rows' Waste Kgs
Total Waste %   = (Total Waste / Total Gross) × 100
Avg Efficiency  = (SUM Actual HK / SUM STD HK) × 100
```

These same aggregations apply when grouping **by Count** (frame) for comparison.

### Monthly Report Formulas

```
╔═══════════════════════════════════════════════════════════════════════════╗
║ Metric              │ Formula                    │ Data Source            ║
╠══════════════════════╪════════════════════════════╪════════════════════════╣
║ Total Gross Prod     │ SUM(ActualHK × STDConst)   │ production_entries      ║
║ Total Net Prod       │ Total Gross − Total Waste   │ production_entries      ║
║ Cotton Issue         │ SUM(Cotton+Fiber+Visc+Excel)│ stock_txns (ISSUE)     ║
║ Yarn Realisation %   │ GrossProd / CottonIssue × 100 │ shift_prod + stock_txns║
║ Waste %              │ StockWaste / CottonIssue    │ stock_txns (WASTE)     ║
║ Invisible Loss %     │ 100 − Realisation − Waste   │ Derived                ║
║ UKG                  │ EB Units / Gross Prod       │ eb_entries + shift_prod║
║ Avg Efficiency %     │ SUM(ActualHK)/SUM(StdHK)   │ production_entries      ║
╚══════════════════════╧════════════════════════════╧════════════════════════╝
```

### Stock Formula

```
Current Stock (per material) = SUM(PURCHASE + RETURN) − SUM(ISSUE + DISPATCH)

Never stored as a running balance. Always computed from all transactions.
```

### EB Formula

```
EB Units Consumed = Closing Units − Opening Units
```

---

## Part 7: Data Flow — Entry to Report

### Flow 1: Production → Daily Dashboard

```
User fills Production Entry page
  → Session: date, shiftHours, totalSpindles
  → Rows: rfNo, siderName, count, stdConst, stdHK, actualHK, runHrs, idle, waste
  ↓
Frontend calculates 6 metrics in real-time (client-side preview)
  ↓
User clicks Save (single row) or Save All (batch)
  ↓
Backend validates → stores raw values in production_entries
  ↓
Daily Dashboard fetches entries for selected date
  ↓
Backend enrichWithCalculations() computes 6 metrics per row
  ↓
Groups by Count → count-wise summaries
  ↓
Grand totals → Total Gross, Net, Waste %, Avg Efficiency
  ↓
Dashboard renders: KPI cards, Count comparison chart, Entries table
```

### Flow 2: Production + Stock + EB → Monthly Dashboard

```
Monthly Dashboard request for Year/Month
  ↓
QUERY 1: All production_entries for the month
  → Enrich each with calculations
  → SUM: Total Gross, Net, Waste, Actual HK, STD HK
  → Group by Count for breakdown
  ↓
QUERY 2: stock_transactions where type=ISSUE and material in [COTTON,FIBER,VISCOSE,EXCEL]
  → SUM kgs per material → Cotton Issue
  ↓
QUERY 3: stock_transactions where material=WASTE
  → SUM kgs → Stock Waste
  ↓
QUERY 4: eb_entries for this month/year
  → EB Units = Closing − Opening
  ↓
DERIVE:
  → Yarn Realisation % = Total Gross Production / Cotton Issue × 100
  → Waste %            = Stock Waste / Cotton Issue × 100
  → Invisible Loss %   = 100 − Realisation − Waste
  → UKG                = EB Units / Total Gross
  → Avg Efficiency     = (Total Actual HK / Total STD HK) × 100
  ↓
Dashboard renders: Production KPIs, Count breakdown, Energy, Raw Materials,
                   Realisation/Waste analysis, Production trend chart
```

### Flow 3: Monthly → Yearly Dashboard

```
Yearly Dashboard request for Year
  ↓
For each month (1-12): call getMonthlySummary()
  ↓
Frontend aggregates across 12 months:
  → Total Gross/Net, Avg Efficiency, Total EB, Yearly UKG
  → Cotton Issue totals → Yearly Realisation, Waste, Invisible Loss
  → Best/Worst month identification
  ↓
Dashboard renders: Annual KPIs, Trend charts, Monthly breakdown table
```

### Flow 4: Stock Entry → Stock Dashboard

```
User submits Stock Entry (PURCHASE/ISSUE/RETURN)
  ↓
Backend creates stock_transaction record
  ↓
Stock Dashboard queries all transactions
  → Groups by materialType + transactionType
  → Current Stock = SUM(inflow) − SUM(outflow) per material
  → Lot-wise breakdown
  ↓
Dashboard renders: Current stock per material, Lot tracking, Recent transactions
```

### Flow 5: Dispatch → Stock Decrease

```
User submits Dispatch Entry
  ↓
Backend atomically:
  1. Creates dispatch_entry record
  2. Creates stock_transaction (type=DISPATCH) for same material/qty
  ↓
Both or neither happen (database transaction)
```

---

## Part 8: Report Generation Details

### Daily Dashboard — What it shows

| Section          | Data Source                 | Metric                             |
| ---------------- | --------------------------- | ---------------------------------- |
| Grand Totals     | shift_prod entries (date)   | Total Gross/Net, Waste %, Avg Eff  |
| Count Comparison | shift_prod grouped by Count | Per-count Gross, Net, Eff %        |
| Entries Table    | shift_prod entries (date)   | All rows with 6 calculated fields  |
| Stock Position   | stock_transactions          | Opening/Closing stock per material |

### Monthly Dashboard — What it shows

| Section            | Data Source                 | Metric                             |
| ------------------ | --------------------------- | ---------------------------------- |
| Production Summary | shift_prod (month range)    | Gross/Net, Waste, Eff %, Daily avg |
| Count Breakdown    | shift_prod grouped by Count | Per-count production & efficiency  |
| Energy             | eb_entries (month/year)     | EB Units, UKG                      |
| Raw Materials      | stock_txns (ISSUE, month)   | Cotton/Fiber/Viscose/Excel issued  |
| Realisation        | stock_txns + shift_prod     | Yarn Real %, Waste %, Inv Loss %   |
| Production Trend   | shift_prod per day          | Daily gross/net/waste line chart   |
| Day-by-Day Table   | shift_prod per day          | Tabular daily breakdown            |

### Yearly Dashboard — What it shows

| Section           | Data Source                | Metric                           |
| ----------------- | -------------------------- | -------------------------------- |
| Annual Production | 12× monthly aggregation    | Gross/Net, Waste, Avg Monthly    |
| Energy            | 12× monthly EB aggregation | Total EB, Yearly UKG             |
| Realisation       | 12× monthly aggregation    | Yarn Real %, Waste %, Inv Loss % |
| Performance       | Monthly comparison         | Best/Worst month, Daily avg      |
| Trend Charts      | Monthly data points        | Efficiency & Realisation trends  |
| Monthly Table     | 12 monthly rows            | All metrics per month            |

---

## Part 9: Safeguards & Validation

### Server-Side Validation (Zod schemas)

| Field                   | Rule                       |
| ----------------------- | -------------------------- |
| shiftHours              | Must be positive number    |
| totalSpindlesPerMachine | Must be positive integer   |
| rfNo                    | Required, max 50 chars     |
| siderName               | Required, max 200 chars    |
| count                   | Required, max 50 chars     |
| stdConstant             | Must be positive number    |
| stdHK                   | Must be positive number    |
| actualHK                | Cannot be negative         |
| runHrs                  | Cannot be negative         |
| idleSpindles            | Cannot be negative integer |
| wasteKgs                | Cannot be negative         |

### Client-Side Validation

- Required field highlighting
- Real-time calculation preview (if inputs are invalid, calculated fields show "—")
- Save button disabled when no valid unsaved rows

### Business Rules

- **Dispatch reduces stock atomically** — if stock creation fails, dispatch is rolled back
- **EB Opening auto-fills** — from previous month's closing, preventing gaps
- **No negative stock** — enforced at validation layer
- **Division by zero protected** — all calculation functions return 0 when denominator is 0

---

## Part 10: Verification Table

| What                               | How to Verify                                                            |
| ---------------------------------- | ------------------------------------------------------------------------ |
| Production entry saves correctly   | Submit via entry page → check DB → verify in Production Log              |
| 6 formulas calculate correctly     | Enter known values → compare calculated output with manual calculation   |
| Batch save works atomically        | Save multiple rows → all should appear or none                           |
| Daily dashboard shows correct data | Enter production for a date → navigate to Daily Dashboard for that date  |
| Monthly totals aggregate correctly | Enter data for multiple days → check Monthly Dashboard sums              |
| Cotton Issue calculation           | Enter ISSUE stock transactions → check Monthly raw materials section     |
| Yarn Realisation formula           | Verify: Gross Production / Cotton Issue × 100                            |
| UKG formula                        | Verify: EB Units / Gross Production                                      |
| Stock balance                      | Enter PURCHASE, ISSUE → check Stock Dashboard balance = Purchase − Issue |
| Dispatch reduces stock             | Create dispatch → verify stock decreased by same amount                  |

---

## Part 11: FAQ

**Q: Why is "Count" the same as "Frame Number"?**
A: In the old system, frame types were limited to FRAME_41 and FRAME_47. In 2026, the "Count" field (e.g., "41s", "47s") serves as the frame identifier, but is more flexible — it can be any count value, not limited to two options.

**Q: Why are calculations not stored?**
A: To maintain data integrity. If a formula changes, all historical data recalculates correctly. If you store derived values and later discover a formula bug, you'd need to backfill all historical records.

**Q: Why is stock transaction-based instead of balance-based?**
A: Transaction-based provides a complete audit trail. You can reconstruct the stock position at any point in time. Balance-based systems lose history when overwritten.

**Q: What does "Worked Spindles" mean?**
A: It represents the effective spindle-hours. If you have 1728 spindles but 100 are idle and the machine ran for only 11 of 12 shift hours, the "worked" spindles = (1728 − 100) × (11/12) = 1492.33. This normalizes production metrics across different running conditions.

**Q: What is Invisible Loss?**
A: It's the unaccounted gap. Cotton Issue = 100%. Yarn Realisation is how much cotton was successfully converted to yarn (e.g., 88%). Measured Waste (stock transactions for WASTE material) is another portion (e.g., 4%). Invisible Loss = 100 − 88 − 4 = 8%. This includes moisture loss, handling loss, and measurement variances.

**Q: Can I add more count types beyond 41s and 47s?**
A: Yes. The Count field is a free-form string. You can enter any count value (e.g., "30s", "60s", "80s"). Reports will automatically group by whatever count values exist in the data.

**Q: How does the batch save work?**
A: All rows are submitted in a single API call. The backend wraps all inserts in a database transaction — either all rows save successfully, or none do. This prevents partial data.

**Q: What happens if I enter production for the same date multiple times?**
A: Multiple entries for the same date are allowed and expected (different R/F numbers, different shifts). The Daily Dashboard aggregates all entries for a date.

---

## Appendix: API Endpoints

### Shift Production

| Method | Endpoint                               | Description             |
| ------ | -------------------------------------- | ----------------------- |
| POST   | `/api/v1/shift-production`             | Create single entry     |
| POST   | `/api/v1/shift-production/batch`       | Create batch of entries |
| GET    | `/api/v1/shift-production`             | List with filters       |
| GET    | `/api/v1/shift-production/daily/:date` | All entries for a date  |
| GET    | `/api/v1/shift-production/:id`         | Single entry            |
| PUT    | `/api/v1/shift-production/:id`         | Update entry            |
| DELETE | `/api/v1/shift-production/:id`         | Delete entry            |

### Dashboard

| Method | Endpoint                                 | Description     |
| ------ | ---------------------------------------- | --------------- |
| GET    | `/api/v1/dashboard/daily/:date`          | Daily summary   |
| GET    | `/api/v1/dashboard/monthly/:year/:month` | Monthly summary |
| GET    | `/api/v1/dashboard/yearly/:year`         | Yearly summary  |
| GET    | `/api/v1/dashboard/stock`                | Stock dashboard |

### Stock

| Method | Endpoint                              | Description                    |
| ------ | ------------------------------------- | ------------------------------ |
| POST   | `/api/v1/stock/transactions`          | Create stock transaction       |
| GET    | `/api/v1/stock/transactions`          | List transactions with filters |
| GET    | `/api/v1/stock/current`               | Current stock per material     |
| GET    | `/api/v1/stock/current/:materialType` | Stock for specific material    |
| GET    | `/api/v1/stock/lot-wise`              | Stock grouped by lot           |
| GET    | `/api/v1/stock/party-wise`            | Stock grouped by party         |
| GET    | `/api/v1/stock/opening/:date`         | Opening stock for date         |
| GET    | `/api/v1/stock/closing/:date`         | Closing stock for date         |
| PUT    | `/api/v1/stock/transactions/:id`      | Update transaction             |
| DELETE | `/api/v1/stock/transactions/:id`      | Delete transaction             |

### Packing

| Method | Endpoint              | Description               |
| ------ | --------------------- | ------------------------- |
| POST   | `/api/v1/packing`     | Create packing entry      |
| GET    | `/api/v1/packing`     | List entries with filters |
| GET    | `/api/v1/packing/:id` | Get single entry          |
| PUT    | `/api/v1/packing/:id` | Update entry              |
| DELETE | `/api/v1/packing/:id` | Delete entry              |

### Dispatch

| Method | Endpoint               | Description                                    |
| ------ | ---------------------- | ---------------------------------------------- |
| POST   | `/api/v1/dispatch`     | Create dispatch entry (auto-creates stock txn) |
| GET    | `/api/v1/dispatch`     | List entries with filters                      |
| GET    | `/api/v1/dispatch/:id` | Get single entry                               |
| PUT    | `/api/v1/dispatch/:id` | Update entry                                   |
| DELETE | `/api/v1/dispatch/:id` | Delete entry                                   |

### EB

| Method | Endpoint                                   | Description                  |
| ------ | ------------------------------------------ | ---------------------------- |
| POST   | `/api/v1/eb`                               | Create EB entry              |
| GET    | `/api/v1/eb`                               | List entries                 |
| GET    | `/api/v1/eb/month/:year/:month`            | Get entry for specific month |
| GET    | `/api/v1/eb/previous-closing/:year/:month` | Get previous month's closing |
| GET    | `/api/v1/eb/:id`                           | Get single entry             |
| PUT    | `/api/v1/eb/:id`                           | Update entry                 |
| DELETE | `/api/v1/eb/:id`                           | Delete entry                 |
