# 🏭 SpinLytics — Complete System Explanation Guide

> **Purpose**: This document is designed to walk a client through the entire SpinLytics system — every screen, every input field, every formula, every data connection, and how data flows from entry to dashboards to reports.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Module 1: Production Entry](#2-production-entry)
3. [Module 2: Stock Entry](#3-stock-entry)
4. [Module 3: Packing Entry](#4-packing-entry)
5. [Module 4: Dispatch Entry](#5-dispatch-entry)
6. [Module 5: EB (Electricity) Entry](#6-eb-entry)
7. [Daily Dashboard](#7-daily-dashboard)
8. [Monthly Dashboard](#8-monthly-dashboard)
9. [Yearly Dashboard](#9-yearly-dashboard)
10. [Stock Dashboard](#10-stock-dashboard)
11. [Record Logs](#11-record-logs)
12. [Excel Reports](#12-excel-reports)
13. [Complete Formula Reference](#13-formula-reference)
14. [Complete Data Flow Diagram](#14-data-flow)
15. [Key Business Rules](#15-business-rules)

---

## 1. System Overview

SpinLytics is an **ERP-lite system for textile spinning mills**. It digitises the entire workflow:

```
Raw Material Purchase → Stock → Issue to Production → Shift Production
→ Autocorner Winding → Packing → Dispatch to Buyers → Reports & Analytics
```

### Architecture

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React + Vite | Web dashboard & data entry |
| Backend | Node.js + Express | REST API & business logic |
| Database | PostgreSQL + Prisma | Data storage |
| Reports | ExcelJS | Professional Excel exports |

### Core Design Principle
> **All derived/calculated values are computed at query time — NEVER stored in the database.** This ensures data consistency and allows formula corrections without data migration.

### Unit Conversion (used everywhere)
```
1 Bag = 60 Kilograms
```

---

## 2. Production Entry

**URL**: `/entry/production`
**Purpose**: Record shift-wise spinning production data. This is the primary data entry screen of the system.

### Session Settings (shared across all rows)

| Field | Type | Options | Description |
|-------|------|---------|-------------|
| **Date** | Date picker | Any date | The production date for this shift |
| **Shift Hours** | Dropdown | `8 Hours` or `12 Hours` | Duration of the shift |
| **Total Spindles/Machine** | Dropdown | `1152 (Standard)` or `1728 (Large)` | Total spindles per machine frame |

### Per-Row Input Fields (the spreadsheet table)

| # | Field | Type | Example | Description |
|---|-------|------|---------|-------------|
| 1 | **R/F No.** | Text | `RF-1` | Ring Frame number — identifies the machine |
| 2 | **Sider Name** | Text | `Raju` | Name of the worker operating the machine |
| 3 | **Count** | Text | `41s` or `47s` | Yarn count — identifies the frame/product type |
| 4 | **STD Constant** | Number | `0.005647` | Standard constant for the yarn count (fixed per count) |
| 5 | **STD HK** | Number | `85.5` | Standard Hank — the expected/target production metric |
| 6 | **Actual HK** | Number | `82.3` | Actual Hank — what was actually produced |
| 7 | **Run Hrs** | Number | `11.4` | How many hours the machine actually ran |
| 8 | **Idle Spindles** | Number | `0` | Number of spindles that were idle/broken |
| 9 | **Waste Kgs** | Number | `1.5` | Waste generated during production (in kg) |
| 10 | **Autocorner Kg** | Number | `0.45` | Autocorner production in kg (optional — enables 2-stage loss analysis) |
| 11 | **Stoppages** | Text | `Power cut 30m` | Reason for any stoppages (optional) |

### Auto-Calculated Fields (computed in real-time, never stored)

| # | Calculated Field | Formula | Example |
|---|-----------------|---------|---------|
| 1 | **Production Kgs (Gross)** | `Actual HK × STD Constant` | `82.3 × 0.005647 = 0.465` |
| 2 | **Actual Production (Net)** | `Gross Kgs − Waste Kgs` | `0.465 − 0.015 = 0.450` |
| 3 | **Waste %** | `(Waste Kgs / Gross Kgs) × 100` | `(0.015 / 0.465) × 100 = 3.23%` |
| 4 | **Worked Spindles** | `(Total Spindles − Idle Spindles) × (Run Hrs / Shift Hrs)` | `(1728 − 0) × (11.4 / 12) = 1641.6` |
| 5 | **Grams/Spindle** | `(Net Kgs × 1000) / Worked Spindles` | Net production per spindle |
| 6 | **Efficiency %** | `(Actual HK / STD HK) × 100` | `(82.3 / 85.5) × 100 = 96.26%` |
| 7 | **Overall Yield %** | `(Net Kgs / Gross Kgs) × 100` | `(0.450 / 0.465) × 100 = 96.77%` |
| 8 | **Spinning Loss %** ⭐ | `(Gross − Autocorner) / Gross × 100` | Only shown if Autocorner Kg entered |
| 9 | **Autocorner Loss %** ⭐ | `(Autocorner − Net) / Autocorner × 100` | Only shown if Autocorner Kg entered |

> ⭐ **2-Stage Loss Analysis**: When Autocorner Kg is entered, the system breaks total loss into two stages:
> - **Spinning Loss** = material lost during spinning (Gross → Autocorner)
> - **Autocorner Loss** = material lost during winding (Autocorner → Net/Packing)
> - **Total Loss** = Spinning Loss + Autocorner Loss = Gross − Net

### Save Options

- **Save Row** (💾): Saves individual row immediately (auto-save)
- **Save All**: Batch saves all unsaved rows in one transaction
- **Row Status Indicator**: 🔴 Unsaved → 🟡 Saving → 🟢 Saved

### What happens on save?
```
Frontend → POST /api/v1/shift-production → Backend validates with Zod
→ Stores ONLY input fields in PostgreSQL → Returns entry + calculated fields
```

---

## 3. Stock Entry

**URL**: `/entry/stock`
**Purpose**: Record stock transactions — purchases, issues to production, and returns.

### Input Fields

| Field | Type | Options | Description |
|-------|------|---------|-------------|
| **Date** | Date | Any date | Transaction date |
| **Material Type** | Dropdown | `COTTON`, `VISCOSE`, `FIBER`, `EXCEL`, `YARN`, `WASTE` | Type of material |
| **Transaction Type** | Dropdown | `PURCHASE`, `ISSUE`, `RETURN` | What kind of transaction |
| **Lot No.** | Text | e.g. `LOT-2026-001` | Identifies the material batch |
| **Party Name** | Text | e.g. `ABC Textiles` | Supplier/vendor name |
| **Bags** | Number | e.g. `10` | Quantity in bags |
| **Price per Bag (₹)** | Number | e.g. `5000` | Optional — cost per bag |
| **Remarks** | Text | Free text | Optional notes |

### Auto-Calculated (shown on screen)

| Calculated | Formula |
|-----------|---------|
| **Kgs** | `Bags × 60` |
| **Total Price** | `Bags × Price per Bag` |

### Transaction Types Explained

| Type | Effect on Stock | Example |
|------|----------------|---------|
| **PURCHASE** | ➕ Increases stock | Buying cotton from supplier |
| **ISSUE** | ➖ Decreases stock | Issuing cotton to production floor |
| **RETURN** | ➕ Increases stock | Returning unused material |
| **DISPATCH** | ➖ Decreases stock | ⚠️ Cannot create here — must use Dispatch Entry |

### Stock Calculation Rule
```
Current Stock = SUM(PURCHASE + RETURN) − SUM(ISSUE + DISPATCH)
```

### Validation
- **ISSUE** transactions check if sufficient stock exists before allowing
- **DISPATCH** type is blocked — must go through Dispatch Entry page

---

## 4. Packing Entry

**URL**: `/entry/packing`
**Purpose**: Record yarn packing — bridges production and stock. When yarn is produced, it gets packed into bags before it becomes stock.

### Input Fields

| Field | Type | Options | Description |
|-------|------|---------|-------------|
| **Date** | Date | Any date | Packing date |
| **Source** | Dropdown | `Autocorner`, `Production` | Where the yarn came from |
| **Yarn Type** | Text | e.g. `Cotton 40s` | Type of yarn being packed |
| **Bags** | Number | e.g. `8` | Number of bags packed |
| **Lot No.** | Text | e.g. `LOT-2026-042` | Lot identifier |
| **Remarks** | Text | Free text | Optional notes |

### Auto-Calculated

| Calculated | Formula |
|-----------|---------|
| **Kgs** | `Bags × 60` |

### Packing Sources

| Source | Meaning |
|--------|---------|
| **AUTOCORNER** | Yarn from the autoconer winding machine |
| **PRODUCTION** | Yarn directly from the spinning production floor |

---

## 5. Dispatch Entry

**URL**: `/entry/dispatch`
**Purpose**: Record outgoing dispatches to buyers/parties. **Automatically reduces stock.**

### Input Fields

| Field | Type | Options | Description |
|-------|------|---------|-------------|
| **Date** | Date | Any date | Dispatch date |
| **Material Type** | Dropdown | `COTTON`, `VISCOSE`, `FIBER`, `EXCEL`, `YARN`, `WASTE` | Material being dispatched |
| **Lot No.** | Text | e.g. `LOT-2026-042` | Lot being dispatched |
| **Party Name** | Text | e.g. `XYZ Mills` | Buyer/receiver |
| **Bags** | Number | e.g. `5` | Bags being dispatched |
| **Price per Bag (₹)** | Number | e.g. `6000` | Selling price per bag |
| **Remarks** | Text | Free text | Invoice number, etc. |

### Auto-Calculated

| Calculated | Formula |
|-----------|---------|
| **Kgs** | `Bags × 60` |
| **Total Price** | `Bags × Price per Bag` |

### What happens on save? (CRITICAL — Atomic Transaction)
```
1. Check if sufficient stock exists for this material type
2. If YES → Create Dispatch Entry record
3. AND → Automatically create a DISPATCH-type Stock Transaction
4. Both happen atomically (both succeed or both fail)
```

> **Key Point**: Dispatch is the ONLY way to create DISPATCH-type stock transactions. You cannot create them directly in Stock Entry.

---

## 6. EB (Electricity) Entry

**URL**: `/entry/eb`
**Purpose**: Record monthly electricity meter readings for energy tracking.

### Input Fields

| Field | Type | Options | Description |
|-------|------|---------|-------------|
| **Month** | Dropdown | January–December | The billing month |
| **Year** | Dropdown | Last 3 to next 7 years | The billing year |
| **Opening Units** | Number | e.g. `10000` | Meter reading at start of month |
| **Closing Units** | Number | e.g. `15000` | Meter reading at end of month |

### Auto-Calculated

| Calculated | Formula |
|-----------|---------|
| **EB Consumed** | `Closing Units − Opening Units` |

### Smart Features
- **Auto-fill Opening**: When you select a month, the system fetches the previous month's closing reading and auto-fills it as the opening reading
- **Manual Override**: You can click "Edit manually" to override the auto-filled value
- **Validation**: Closing must be ≥ Opening
- **Uniqueness**: Only one entry per month/year combination

---

## 7. Daily Dashboard

**URL**: `/daily` (also the home page `/`)
**Purpose**: View production summary for a single day with drill-down detail.

### Data Sources
- **Shift Production Entries** for the selected date
- **Stock Transactions** for opening/closing stock

### Sections Displayed

#### A. Production Summary (KPI Cards)
| KPI | Source | Formula |
|-----|--------|---------|
| Gross Production | Sum of all rows | `SUM(Actual HK × STD Constant)` |
| Net Production | Sum of all rows | `SUM(Gross − Waste)` per row |
| Total Waste | Sum of all rows | `SUM(Waste Kgs)` |
| Avg Efficiency | Weighted average | `SUM(Actual HK) / SUM(STD HK) × 100` |
| Overall Yield | Ratio | `Net / Gross × 100` |
| Total Lost | Difference | `Gross − Net` (in kg) |
| Total Entries | Count | Number of shift entries |
| Avg/Count | Average | `Gross / Number of counts` |

#### A2. 2-Stage Loss Analysis (shown when Autocorner data exists)
| KPI | Formula |
|-----|---------|
| Autocorner | `SUM(Autocorner Kg)` — total after spinning |
| Spinning Loss % | `(Gross − Autocorner) / Gross × 100` |
| Autocorner Loss % | `(Autocorner − Net) / Autocorner × 100` |

#### B. Count-wise Breakdown
Groups entries by yarn count (e.g. 41s, 47s) showing per-count totals:
- Gross, Net, Waste Kgs, Waste %, Efficiency %, Yield %
- If autocorner data present: Autocorner Kgs, Spinning Loss %, Autocorner Loss %

#### C. Efficiency Comparison
Automatic highlight of:
- **Best Efficiency**: Count with highest efficiency %
- **Lowest Waste**: Count with lowest waste %
- **Highest Production**: Count with highest gross kgs

#### D. Stoppages & Remarks
Collects all stoppages from shift entries, showing R/F No, Count, and stoppage reason.

#### E. Shift Entries Detail Table
Full table of every shift entry with all calculated fields.

#### F. Stock Position
Shows opening stock (before date) and closing stock (up to date) per material.

### Navigation
← Previous Day | Today | Next Day →

---

## 8. Monthly Dashboard

**URL**: `/monthly`
**Purpose**: Monthly aggregated view combining production, raw materials, energy, and realisation metrics.

### Data Sources (4 different database tables)
| Source | Table | What it provides |
|--------|-------|-----------------|
| A | `shift_production_entries` | Production totals, efficiency, waste |
| B | `stock_transactions` (ISSUE, raw materials) | Cotton Issue (raw material consumed) |
| C | `stock_transactions` (WASTE material) | Stock waste for realisation calc |
| D | `eb_entries` | Electricity consumed |

### Sections Displayed

#### Row 1: Production KPIs
| KPI | Formula |
|-----|---------|
| Gross Production | `SUM(Actual HK × STD Constant)` for all rows in month |
| Net Production | `Gross − Waste` |
| Shift Waste | `SUM(Waste Kgs)` from shift entries |
| Avg Efficiency | `SUM(Actual HK) / SUM(STD HK) × 100` |
| Overall Yield | `Net / Gross × 100` |
| Avg Daily | `Gross Production / Days Recorded` |
| Total Lost | `Gross − Net` (in kg) |
| Total Packing | = Net Production (packed output) |

#### Row 1b: 2-Stage Loss Analysis (shown when Autocorner data exists)
| KPI | Formula |
|-----|---------|
| Autocorner | `SUM(Autocorner Kg)` for month |
| Spinning Loss % | `(Gross − Autocorner) / Gross × 100` |
| Autocorner Loss % | `(Autocorner − Net) / Autocorner × 100` |

#### Row 2: Count-wise Breakdown
Per yarn-count production with % of total.
Includes per-count: Autocorner Kgs, Spinning Loss %, Autocorner Loss % (when data exists).

#### Row 3: Energy
| KPI | Formula |
|-----|---------|
| UKG (Units per Kg) | `EB Units Consumed / Gross Production` |
| EB Units | `Closing − Opening` from EB entry |
| Days Recorded | Count of unique production dates |

#### Row 4: Raw Materials Issued
| Field | Source |
|-------|--------|
| Cotton Issued | `SUM(kgs)` of ISSUE transactions for COTTON |
| Fiber Issued | `SUM(kgs)` of ISSUE transactions for FIBER |
| Viscose Issued | `SUM(kgs)` of ISSUE transactions for VISCOSE |
| Excel Issued | `SUM(kgs)` of ISSUE transactions for EXCEL |
| **Total Cotton Issue** | `Cotton + Fiber + Viscose + Excel` |

#### Row 5: Realisation & Loss Analysis ⭐
| KPI | Formula | Meaning |
|-----|---------|---------|
| **Yarn Realisation %** | `Gross Production / Cotton Issue × 100` | % of raw material converted to yarn |
| **Waste %** | `Stock Waste / Cotton Issue × 100` | % lost as waste |
| **Invisible Loss %** | `100 − Realisation% − Waste%` | Unaccounted loss |
| **Raw Material Efficiency %** | `Gross Production / Cotton Issue × 100` | How efficiently raw material is used |

> **Key Relationship**: `Realisation% + Waste% + Invisible Loss% = 100%` always

#### Row 6: Day Performance
| KPI | How Determined |
|-----|----------------|
| **Best Day (Production)** | Day with highest gross production |
| **Lowest Day** | Day with lowest gross production |
| **Best Efficiency Day** | Day with highest avg efficiency % |

#### Charts
- **Production by Count**: Bar chart comparing counts
- **Realisation Breakdown**: Donut chart (Realisation vs Waste vs Invisible Loss)
- **Daily Production Trend**: Line chart showing daily gross/net/waste

#### Day-by-Day Table
Detailed breakdown per day: Day, Gross, Net, Waste, Waste%, **Yield%**, Avg Efficiency%.

---

## 9. Yearly Dashboard

**URL**: `/yearly`
**Purpose**: Year-at-a-glance view aggregating all 12 months.

### Data Source
Calls Monthly Dashboard API for each of 12 months, then aggregates.

### Sections

#### Annual Production
| KPI | Formula |
|-----|---------|
| Gross Production | Sum of 12 monthly gross values |
| Net Production | Sum of 12 monthly net values |
| Shift Waste | Sum of 12 monthly waste values |
| Avg Monthly | `Yearly Gross / Active Months` |
| Active Months | Count of months with production data |
| Overall Yield | `Net / Gross × 100` |
| Total Packing | = Net Production |
| Total Lost | `Gross − Net` |
| Total Days | Sum of days recorded across all months |

#### Autocorner (shown when data exists)
| KPI | Formula |
|-----|---------|
| Autocorner | Sum of 12 monthly autocorner totals |
| Spinning Loss % | `(Yearly Gross − Yearly Autocorner) / Yearly Gross × 100` |
| Autocorner Loss % | `(Yearly Autocorner − Yearly Net) / Yearly Autocorner × 100` |

#### Energy Consumption
| KPI | Formula |
|-----|---------|
| Total EB Consumed | Sum of 12 monthly EB values |
| Avg UKG (Year) | `Total EB / Total Gross Production` |
| Avg Monthly EB | `Total EB / Months with EB data` |
| Best UKG Month | Month with lowest UKG (most efficient) |
| Worst UKG Month | Month with highest UKG (least efficient) |

#### Raw Material & Realisation
| KPI | Formula |
|-----|---------|
| Cotton Issued | Sum of 12 monthly cotton issue |
| Yarn Realisation | `Yearly Gross / Yearly Total Cotton Issue × 100` |
| Waste % | `Yearly Stock Waste / Yearly Cotton Issue × 100` |
| Invisible Loss | `100 − Realisation − Waste` |

#### Performance Highlights
- Best Month (highest production)
- Lowest Month (lowest production)
- Avg Daily (Year)
- Total Lost (Gross − Net)
- Best UKG Month / Worst UKG Month

#### Charts
- Monthly Production Trend (bar chart)
- Efficiency & Realisation Trends (line chart)

#### Monthly Breakdown Table
12-row table with: Month, Gross, Net, Waste, **Yield%**, Eff%, Realisation%, Waste%, Inv Loss%, EB, UKG, Days

---

## 10. Stock Dashboard

**URL**: `/stock`
**Purpose**: Real-time stock position across all materials.

### Sections

#### Current Stock Overview
Material cards showing current stock in kg and bags for each material type.

#### Stock KPIs
| KPI | Formula |
|-----|---------|
| Total Stock | `SUM(all material stocks)` in kg |
| Total Bags | `Total Stock / 60` |
| Material Types | Count of distinct materials with stock |

#### Stock Comparison Chart
Bar chart comparing stock levels across material types.

#### Stock Breakdown (Tabbed)
- **Lot-wise**: Stock grouped by material + lot number
- **Party-wise**: Stock grouped by material + party/supplier name

#### Recent Transactions
Last 20 stock transactions with date, type, material, lot, party, kg, bags.

---

## 11. Record Logs

### Production Log (`/production-log`)
Shows last 50 shift production entries with all calculated fields.

### Packing Log (`/packing-log`)
Filterable by date range and source. Paginated (15/page).

### Dispatch Log (`/dispatch-log`)
Filterable by date range and material type. Shows page totals for value and kg. Paginated (15/page).

### Energy Log (`/energy-log`)
All EB entries sorted chronologically with consumption trend chart.

---

## 12. Excel Reports

Every dashboard has an **Export** button generating professional Excel files.

| Report | Available From | Contents |
|--------|---------------|----------|
| Daily Production | Daily Dashboard | All shift entries + totals + count summaries |
| Monthly Realisation | Monthly Dashboard | Production + raw materials + realisation + energy |
| Yearly Summary | Yearly Dashboard | 12-month breakdown + yearly totals |
| Stock Report | Stock Dashboard | Current stock + lot-wise + recent transactions |
| Material Movement | Stock Dashboard | Inflow/outflow analysis by material |
| Packing Log | Packing Log | All filtered packing entries |
| Dispatch Log | Dispatch Log | All filtered dispatch entries |
| EB Report | Energy Log | All EB entries with consumption |

---

## 13. Formula Reference (Complete)

### Shift-Level Formulas (per production row)

| # | Name | Formula | Unit |
|---|------|---------|------|
| F1 | Production Kgs (Gross) | `Actual HK × STD Constant` | kg |
| F2 | Actual Production (Net) | `Gross Kgs − Waste Kgs` | kg |
| F3 | Waste % (Shift) | `(Waste Kgs / Gross Kgs) × 100` | % |
| F4 | Worked Spindles | `(Total Spindles − Idle) × (Run Hrs / Shift Hrs)` | count |
| F5 | Grams per Spindle | `(Net Kgs × 1000) / Worked Spindles` | g |
| F6 | Efficiency % | `(Actual HK / STD HK) × 100` | % |
| F7 | Overall Yield % | `(Net Kgs / Gross Kgs) × 100` | % |
| F8 | Spinning Loss Kg | `Gross Kgs − Autocorner Kg` | kg |
| F9 | Spinning Loss % | `(Gross − Autocorner) / Gross × 100` | % |
| F10 | Autocorner Loss Kg | `Autocorner Kg − Net Kgs` | kg |
| F11 | Autocorner Loss % | `(Autocorner − Net) / Autocorner × 100` | % |

> **Note**: F8–F11 are only calculated when Autocorner Kg is entered (field is optional).

### Aggregation Formulas (daily/monthly/yearly totals)

| # | Name | Formula |
|---|------|---------|
| A1 | Total Gross Production | `SUM(F1)` across all rows |
| A2 | Total Net Production | `SUM(F2)` across all rows |
| A3 | Total Waste | `SUM(Waste Kgs)` across all rows |
| A4 | Aggregate Waste % | `(Total Waste / Total Gross) × 100` |
| A5 | Avg Efficiency | `(SUM(Actual HK) / SUM(STD HK)) × 100` |
| A6 | Overall Yield % | `(Total Net / Total Gross) × 100` |
| A7 | Total Lost | `Total Gross − Total Net` |
| A8 | Total Autocorner | `SUM(Autocorner Kg)` (when present) |
| A9 | Spinning Loss % | `(Total Gross − Total Autocorner) / Total Gross × 100` |
| A10 | Autocorner Loss % | `(Total Autocorner − Total Net) / Total Autocorner × 100` |

### Stock Formula

| # | Name | Formula |
|---|------|---------|
| S1 | Current Stock | `SUM(PURCHASE + RETURN) − SUM(ISSUE + DISPATCH)` |
| S2 | Opening Stock | All transactions BEFORE the given date |
| S3 | Closing Stock | All transactions UP TO and INCLUDING the date |

### Monthly Report Formulas

| # | Name | Formula | Data Source |
|---|------|---------|-------------|
| M1 | Cotton Issue | `Cotton + Fiber + Viscose + Excel` (all ISSUE txns) | Stock Transactions |
| M2 | Yarn Realisation % | `Gross Production / Cotton Issue × 100` | Production + Stock |
| M3 | Waste % (Monthly) | `Stock Waste / Cotton Issue × 100` | Stock Transactions |
| M4 | Invisible Loss % | `100 − Realisation% − Waste%` | Derived |
| M5 | EB Units Consumed | `Closing Units − Opening Units` | EB Entries |
| M6 | UKG | `EB Units / Gross Production` | EB + Production |

### Key Relationships
```
Realisation% + Waste% + Invisible Loss% = 100%         (always)
Net Production = Gross Production − Shift Waste          (always)
Current Stock = Inflows − Outflows                       (always)
Total Loss = Spinning Loss + Autocorner Loss = Gross − Net  (when autocorner data present)
Overall Yield % = 100 − Total Loss %                    (always)
```

### 3-Stage Production Pipeline
```
        Gross Production (Spinning)
               │
    ┌──────────┴──────────┐
    │                     │
    │ Spinning Loss       │
    │ (Gross − Auto)      │
    │                     │
    └──────────┬──────────┘
               │
        Autocorner Production
               │
    ┌──────────┴──────────┐
    │                     │
    │ Autocorner Loss     │
    │ (Auto − Net)        │
    │                     │
    └──────────┬──────────┘
               │
        Net Production (Packing)
```

---

## 14. Data Flow

### How data moves through the system:

```
┌──────────────────────────────────────────────────────────────┐
│                     DATA ENTRY LAYER                         │
├──────────────┬──────────────┬──────────┬──────────┬─────────┤
│  Production  │    Stock     │ Packing  │ Dispatch │   EB    │
│   Entry      │   Entry      │  Entry   │  Entry   │  Entry  │
└──────┬───────┴──────┬───────┴────┬─────┴────┬─────┴────┬────┘
       │              │            │          │          │
       ▼              ▼            ▼          ▼          ▼
┌──────────────────────────────────────────────────────────────┐
│                     DATABASE LAYER                            │
├──────────────┬──────────────┬──────────┬──────────┬─────────┤
│  production  │    stock     │ packing  │ dispatch │   eb    │
│  _entries    │ _transactions│ _entries │ _entries │ _entries│
└──────┬───────┴──────┬───────┴────┬─────┴────┬─────┴────┬────┘
       │              │            │          │          │
       ▼              ▼            ▼          ▼          ▼
┌──────────────────────────────────────────────────────────────┐
│                   DASHBOARD / REPORT LAYER                    │
├───────────────┬──────────────┬─────────────┬────────────────┤
│    Daily      │   Monthly    │   Yearly    │     Stock      │
│  Dashboard    │  Dashboard   │  Dashboard  │   Dashboard    │
│               │              │             │                │
│ Uses: Prod    │ Uses: Prod   │ Uses: All   │ Uses: Stock    │
│       Stock   │       Stock  │   Monthly   │                │
│               │       EB     │   Data      │                │
└───────────────┴──────────────┴─────────────┴────────────────┘
```

### Dispatch → Stock Connection (Automatic)

```
User creates Dispatch Entry
        │
        ▼
System checks: Is there enough stock?
        │
    ┌───┴───┐
   YES     NO → Error: "Insufficient stock"
    │
    ▼
Creates DISPATCH entry in dispatch_entries table
    │
    ▼
Auto-creates DISPATCH transaction in stock_transactions table
    │
    ▼
Stock automatically decreases
```

### Monthly Dashboard Data Assembly

```
Monthly Dashboard API receives (year, month)
        │
        ├─→ Query 1: All shift_production_entries for that month
        │              → Calculate Gross, Net, Waste, Efficiency
        │
        ├─→ Query 2: All stock_transactions (ISSUE type, raw materials)
        │              → Calculate Cotton Issue
        │
        ├─→ Query 3: All stock_transactions (WASTE material)
        │              → Calculate Stock Waste
        │
        ├─→ Query 4: eb_entries for that month/year
        │              → Calculate EB Units
        │
        └─→ Combine all 4 sources → Calculate:
                Yarn Realisation = Gross / Cotton Issue × 100
                Waste % = Stock Waste / Cotton Issue × 100
                Invisible Loss = 100 − Realisation − Waste
                UKG = EB Units / Gross Production
                Overall Yield = Net / Gross × 100
                Total Lost = Gross − Net
                Spinning Loss = Gross − Autocorner (if present)
                Autocorner Loss = Autocorner − Net (if present)
```

---

## 15. Key Business Rules

### Production
1. **Calculated fields are NEVER stored** — always computed fresh from inputs
2. Session settings (Date, Shift Hours, Total Spindles) apply to ALL rows
3. Both single-row save and batch save are supported
4. Efficiency > 100% is possible (worker exceeded target)
5. **Autocorner Kg is optional** — when provided, enables 2-stage loss breakdown
6. When Autocorner is entered: `Net ≤ Autocorner ≤ Gross` should hold
7. **Total Loss = Spinning Loss + Autocorner Loss** (verified by Gross − Net)

### Stock
8. Stock is **transaction-based** — no running balance is stored
9. Current stock is always calculated: `SUM(inflows) − SUM(outflows)`
10. Inflow types: PURCHASE, RETURN
11. Outflow types: ISSUE, DISPATCH
12. ISSUE transactions verify sufficient stock before allowing
13. DISPATCH transactions CANNOT be created via Stock Entry — must use Dispatch Entry

### Dispatch
14. Every Dispatch atomically creates both a dispatch record AND a stock transaction
15. If stock is insufficient, the entire operation is rejected
16. Updating a dispatch updates the linked stock transaction too
17. Deleting a dispatch deletes the linked stock transaction too (stock restores)

### EB (Electricity)
18. Only ONE entry per month/year (unique constraint)
19. Opening is auto-filled from previous month's closing
20. Closing must be ≥ Opening

### Monthly Report
21. **Cotton Issue** = Cotton + Fiber + Viscose + Excel (all raw materials issued)
22. **Realisation + Waste + Invisible Loss = 100%** (always)
23. **UKG** (Units per Kg) = lower is better (more energy efficient)
24. **Day Performance**: Best Day, Lowest Day, Best Efficiency Day auto-identified

### Yearly Report
25. Aggregates 12 individual monthly summaries
26. Uses same formulas as monthly but across the full year
27. **Best/Worst UKG Month** auto-identified for energy tracking

---

## Appendix: Database Tables Quick Reference

| Table | Key Fields | Purpose |
|-------|-----------|---------|
| `production_entries` | date, rfNo, siderName, count, stdConstant, stdHK, actualHK, runHrs, idleSpindles, wasteKgs, **autocornerKg**, shiftHours, totalSpindlesPerMachine | Shift production data |
| `stock_transactions` | date, materialType, transactionType, lotNo, partyName, bags, kgs, pricePerBag, totalPrice | All stock movements |
| `packing_entries` | date, source, yarnType, bags, kgs, lotNo | Packing records |
| `dispatch_entries` | date, materialType, lotNo, partyName, bags, kgs, pricePerBag, totalPrice | Outgoing dispatches |
| `eb_entries` | month, year, openingUnits, closingUnits | Monthly electricity readings |

### Material Types
`COTTON` · `VISCOSE` · `FIBER` · `EXCEL` · `YARN` · `WASTE`

### Transaction Types
`PURCHASE` (↑ stock) · `ISSUE` (↓ stock) · `DISPATCH` (↓ stock) · `RETURN` (↑ stock)

### Packing Sources
`AUTOCORNER` · `PRODUCTION`

---

*Document generated for SpinLytics v1.0 — Textile Production ERP-lite System*
