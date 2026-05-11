# 🏭 SpinLytics (2026 Standard)

---

## 📌 Overview

This system digitizes and automates a textile production workflow involving:

- Shift-based production tracking (Ring Frame / Count based)
- Inventory & stock management
- Packing & dispatch tracking
- Costing & efficiency calculations
- Daily → Monthly → Yearly reporting

The system replaces Excel-based workflows with a **consistent, transaction-safe, and scalable architecture**.

All data entry happens through the **Web Dashboard** — a single, unified entry point.

---

# 🧠 System Modules

## 🔹 1. Production Module (2026 Standard)

- Row-based shift production entry (per Ring Frame)
- Tracks per-row:
  - R/F No., Sider Name, Count (= Frame identifier)
  - STD Constant, STD HK, Actual HK
  - Run Hours, Idle Spindles, Waste Kgs, Stoppages
- Auto-calculates per-row:
  - Production Kgs (Gross)
  - Actual Production (Net)
  - Waste %
  - Worked Spindles
  - Grams per Spindle
  - Efficiency %
- Aggregates by Count for daily/monthly/yearly reports

---

## 🔹 2. Stock & Inventory Module

- Tracks:
  - Raw materials (Cotton, Viscose, Fiber, Excel)
  - Yarn production
- Supports:
  - Purchase
  - Issue
  - Dispatch
  - Return
- Maintains:
  - Lot-wise tracking
  - Party-wise tracking

---

## 🔹 3. Costing & Reporting Module

- Monthly & yearly aggregation
- Calculates:
  - Yarn Realisation %
  - Waste %
  - Invisible Loss
  - UKG (monthly)
  - Avg Efficiency %
  - Avg Grams per Spindle

---

# 💻 Application Structure

## 💻 Web Dashboard (Data Entry + Reports)

---

### 🔹 Entry Page 1: Production Entry (2026 Standard Sheet)

**Global/Session Settings (set once per shift):**

- Date (Date picker)
- Shift Hours (8 or 12)
- Total Spindles per Machine (1152 or 1728)

**Manual Inputs (per row):**

- R/F No. (String) — Ring Frame identifier
- Sider Name (String) — Operator's name
- Count (String) — Material count (e.g., "41s", "47s") — **THIS IS THE FRAME IDENTIFIER**
- STD Constant (Float)
- STD HK (Float) — Standard expected Hanks
- Actual HK (Float) — Actual Hanks produced
- Run Hrs (Float) — Running hours
- Idle Spindles (Number, default 0)
- Waste Kgs (Float)
- Stoppages (String) — Reason/hours of stoppage

**Auto-Calculated Fields (per row, real-time):**

```
Formula 1: Production Kgs (Gross)
Production Kgs = Actual HK × STD Constant

Formula 2: Actual Production Kgs (Net)
Actual Production = Production Kgs − Waste Kgs

Formula 3: Waste Percentage (%)
Waste % = (Waste Kgs / Production Kgs) × 100
(Returns 0 if Production Kgs = 0)

Formula 4: Worked Spindles
Worked Spindles = (Total Spindles − Idle Spindles) × (Run Hrs / Shift Hours)

Formula 5: Grams per Spindle (2026 Standard — uses NET production)
Grams per Spindle = (Actual Production × 1000) / Worked Spindles

Formula 6: Efficiency (%)
Efficiency % = (Actual HK / STD HK) × 100
```

**Save Modes:**

- Individual row auto-save (save per row)
- Batch "Save All" (saves all unsaved rows at once)

---

### 🔹 Entry Page 2: Stock Entry

**Inputs:**

- Date
- Material Type (Cotton / Viscose / Fiber / Excel / Yarn / Waste)
- Transaction Type (Purchase / Issue / Return)
- Lot No
- Party Name
- Bags
- Price per Bag (optional)
- Remarks (optional)

**Calculations:**

```
1 Bag = 60 kg
KG = Bags × 60

Closing = Opening + Purchase − Issue − Dispatch + Return
Opening = Previous Day Closing
```

---

### 🔹 Entry Page 3: Packing Entry

**Inputs:**

- Date
- Source (Autocorner / Production)
- Yarn Type
- Bags
- Lot No
- Remarks (optional)

---

### 🔹 Entry Page 4: Dispatch Entry

**Inputs:**

- Date
- Material Type
- Lot No
- Party Name
- Bags
- Price per Bag (optional)
- Remarks (optional)

**Effects:**

- Creates dispatch record
- Auto-creates DISPATCH stock transaction (reduces stock)
- Both happen atomically

---

### 🔹 Entry Page 5: EB Entry

**Inputs:**

- Month
- Year
- Opening Units (auto-filled from previous month's closing)
- Closing Units

**Calculation:**

```
EB Units = Closing − Opening
```

---

# 📊 Web Dashboard Reports

---

### 🔹 Page 1: Daily Dashboard

Displays:

- All shift production entries for the date
- Per-row: R/F No, Sider, Count, Actual HK, Gross/Net Kg, Waste %, Efficiency %, G/Spindle
- Count-wise (frame-wise) comparison
- Grand totals: Total Gross/Net Production, Avg Efficiency, Total Waste
- Stock position (Opening/Closing)

---

### 🔹 Page 2: Monthly Dashboard

**Calculations:**

```
Total Production (Gross) = SUM(Actual HK × STD Constant) for all shift entries in month
Total Production (Net) = Total Gross − Total Shift Waste

Cotton Issue = Cotton + Fiber + Viscose + Excel (ISSUE transactions)

Yarn Realisation % = Total Gross Production / Cotton Issue × 100

Waste % = Stock Waste / Cotton Issue × 100

Invisible Loss = 100 − Realisation − Waste

UKG = EB Units / Total Gross Production

Avg Efficiency = (Total Actual HK / Total STD HK) × 100
```

---

### 🔹 Page 3: Yearly Dashboard

- Aggregated monthly data with same formulas applied at yearly level

---

### 🔹 Page 4: Stock Dashboard

Displays:

- Current stock per material
- Lot-wise tracking
- Party-wise tracking
- Recent transactions

---

# 🔄 Data Flow Architecture

---

### 🔁 Flow 1: Production → Reports

```
Shift Production Entry → Auto-calculate 6 metrics →
Daily Dashboard (per-row detail) →
Monthly Dashboard (aggregated by month) →
Yearly Dashboard (aggregated by year)
```

---

### 🔁 Flow 2: Stock → Cotton Issue → Realisation

```
Stock ISSUE Transactions (Cotton+Fiber+Viscose+Excel) →
Cotton Issue (monthly sum) →
Compared with Total Production from shift entries →
Yarn Realisation %, Waste %, Invisible Loss %
```

---

### 🔁 Flow 3: Stock → Dispatch

```
Stock → Dispatch → Stock Decrease (atomic)
```

---

### 🔁 Flow 4: EB → UKG

```
EB Entry (Closing − Opening) → Monthly EB →
UKG = EB / Total Gross Production
```

---

# 🧮 Core Principles

---

### ⚙️ 1. Transaction-Based System (CRITICAL)

- Never update stock directly
- Always insert transactions
- Stock = SUM of all transactions

---

### ⚙️ 2. Do NOT Store Derived Values

Always calculate dynamically:

- Production Kgs (Gross/Net)
- Waste %, Efficiency %
- Worked Spindles, Grams/Spindle
- Realisation %, UKG

---

### ⚙️ 3. Units Consistency

- Store everything in KG
- Convert from bags only at input layer

---

### ⚙️ 4. Count = Frame Identifier

- "Count" field (e.g., "41s", "47s") replaces the old Frame Number concept
- Grouping and comparison in reports is done by Count

---

### ⚙️ 5. Data Integrity Rules

- No negative stock
- Dispatch auto-creates stock transaction atomically

---

# 🧱 Tech Stack

### 🎨 Frontend

- React (Vite) — Web Dashboard + Data Entry

---

### ⚙️ Backend

- Node.js
- Express.js
- Prisma ORM

---

### 🗄️ Database

- PostgreSQL

---

# 🚀 Goal

Build a **transaction-safe, scalable ERP-lite system** that ensures:

- Accurate shift-based production tracking
- Reliable inventory management
- Consistent costing calculations
- Elimination of Excel-based errors
- Single unified web interface for entry and reporting
