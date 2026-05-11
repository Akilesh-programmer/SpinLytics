# SpinLytics — Old vs New System: What Changed & What Was Lost

> **Purpose:** This document lists every feature, formula, and analytics item from the old system, clearly showing what was preserved (mapped to new model), what was added new, and what was lost — with exact reasons for each loss.

---

## Quick Summary

| Category | Preserved ✅ | Lost ❌ | New ✨ |
|---|---|---|---|
| Production Formulas | 7 | 1 | 3 |
| Dashboard Sections | 14 | 2 | 5 |
| Report Formulas | 7 | 1 | 1 |
| Entry Features | 5 | 1 | 3 |

> **UPDATE**: Autocorner Kg field has been added to the production entry, restoring 2-stage loss analysis (Spinning Loss + Autocorner Loss). Only daily EB-related features remain lost.

---

# PART 1: THE FUNDAMENTAL CHANGE

## Old System — Frame-Based Production Entry

The operator entered **one record per frame per day** with these fields:

```
Date, Frame Number (41 or 47), Production (kg), Autocorner Production (kg),
Packing (kg), EB Units, No. of Spindles, Remarks
```

This created a **3-stage production pipeline**:
```
Raw Material → Spinning (Production kg) → Autocorner Winding (Autocorner kg) → Packing (Packing kg)
```

Each stage had a measurable loss:
- **Stage 1 Loss:** Spinning Loss = Production − Autocorner
- **Stage 2 Loss:** Autocorner Loss = Autocorner − Packing

## New System — Shift-Based Production Entry (Spreadsheet)

The operator enters **multiple rows per day** (one per machine/sider) with these fields:

```
Session: Date, Shift Hours, Total Spindles Per Machine
Per Row: R/F No, Sider Name, Count, STD Constant, STD HK, Actual HK,
         Run Hrs, Idle Spindles, Waste Kgs, Stoppages
```

This creates a **single-stage production pipeline**:
```
Raw Material → Spinning (Gross Kgs = Actual HK × STD Constant) → Net Kgs (Gross − Waste)
```

There is only **one loss stage**: Waste.

## Why The Change?

| Reason | Details |
|---|---|
| **More granular tracking** | Old: 1-2 entries/day (per frame). New: Multiple entries/day (per machine per sider) |
| **Worker accountability** | New system tracks which sider operated which machine |
| **Efficiency metrics** | New system calculates Efficiency % (Actual HK / STD HK) — not possible in old system |
| **Spindle-level analysis** | New system calculates Worked Spindles and Grams/Spindle with run hours |
| **Standardised constants** | New system uses STD Constant and STD HK for benchmarking against standards |

---

# PART 2: FEATURES PRESERVED (Mapped to New Model)

These features existed in the old system and are **fully available** in the new system, with adjusted formulas:

### 2.1 — Overall Yield %

| | Old System | New System |
|---|---|---|
| **Formula** | `(Packing ÷ Production) × 100` | `(Net Kgs ÷ Gross Kgs) × 100` |
| **Where shown** | Daily, Monthly, Yearly dashboards | ✅ Daily, Monthly, Yearly dashboards |
| **Meaning** | Same — what % of production was usable | Same |

### 2.2 — Production Loss (kg)

| | Old System | New System |
|---|---|---|
| **Formula** | `Production − Packing` (total loss through both stages) | `Gross − Net` (= Waste Kgs) |
| **Where shown** | All dashboards as "Total Lost" | ✅ All dashboards as "Total Lost" |

### 2.3 — Waste % (Shift Level)

| | Old System | New System |
|---|---|---|
| **Formula** | `Spinning Loss % = (Prod − Auto) ÷ Prod × 100` | `Waste % = (Waste Kgs ÷ Gross Kgs) × 100` |
| **Where shown** | Per-frame and combined | ✅ Per-row, per-count, and combined |

### 2.4 — GPS (Grams Per Spindle)

| | Old System | New System |
|---|---|---|
| **Formula** | `Production (kg) ÷ No. of Spindles` | `(Net Kgs × 1000) ÷ Worked Spindles` |
| **Where shown** | Per-frame, daily dashboard | ✅ Per-row, daily dashboard |
| **Note** | New system is more accurate — uses Worked Spindles (adjusts for idle spindles and run hours) |

### 2.5 — Count/Frame Comparison

| | Old System | New System |
|---|---|---|
| **What** | Frame 41 vs Frame 47 side-by-side | Count 41s vs Count 47s (same concept) |
| **Charts** | Bar chart comparing frames | ✅ Bar chart comparing counts |
| **Efficiency Comparison** | Which frame has lower loss | ✅ Which count has best efficiency, lowest waste, highest production |

### 2.6 — Combined Totals

| | Old System | New System |
|---|---|---|
| **What** | Sum of Frame 41 + Frame 47 | Sum of all rows across all counts |
| **KPIs shown** | Production, Packing, Yield, Loss%, UKG, GPS | ✅ Gross, Net, Waste%, Efficiency%, Yield%, Total Lost |

### 2.7 — Stock Position (Daily)

Fully preserved. Opening/Closing stock per material with change indicators.

### 2.8 — Monthly Realisation & Loss Analysis

| | Old System | New System |
|---|---|---|
| **Cotton Issue** | `Cotton + Fiber + Viscose + Excel` (ISSUE txns) | ✅ Identical formula |
| **Yarn Realisation %** | `(Cotton Issue − Production) ÷ Cotton Issue × 100` | `Gross Production ÷ Cotton Issue × 100` |
| **Waste %** | `Stock Waste ÷ Cotton Issue × 100` | ✅ Identical formula |
| **Invisible Loss %** | `100 − Realisation − Waste` | ✅ Identical formula |

### 2.9 — Monthly UKG

| | Old System | New System |
|---|---|---|
| **Formula** | `EB Units (from EB entry) ÷ Total Production` | `EB Units (from EB entry) ÷ Total Gross Production` |
| **Where** | Monthly and Yearly dashboards | ✅ Monthly and Yearly dashboards |

### 2.10 — Day-by-Day Table (Monthly)

Preserved with columns: Day, Gross, Net, Waste, Waste%, Yield%, Avg Efficiency%.

### 2.11 — Day Performance (Monthly)

| | Old System | New System |
|---|---|---|
| **Best Day** | Highest production day | ✅ Highest gross production day |
| **Lowest Day** | Lowest production day | ✅ Lowest gross production day |
| **Best Efficiency Day** | N/A (old had Best UKG Day) | ✅ Best Efficiency % day |

### 2.12 — Yearly Best/Worst UKG Month

| | Old System | New System |
|---|---|---|
| **Best UKG Month** | Month with lowest UKG | ✅ Preserved |
| **Worst UKG Month** | Month with highest UKG | ✅ Preserved |

### 2.13 — Stoppages / Remarks

| | Old System | New System |
|---|---|---|
| **Where** | Per-frame remarks shown in daily dashboard | ✅ Per-row stoppages collected and shown in daily dashboard |

### 2.14 — Raw Material Efficiency %

| | Old System | New System |
|---|---|---|
| **Formula** | `Production ÷ Cotton Issue × 100` | ✅ `Gross Production ÷ Cotton Issue × 100` |

---

# PART 3: FEATURES LOST (Cannot Be Reproduced)

These features existed in the old system but are **permanently lost** because the underlying data is no longer collected:

---

## ✅ 3.1 — Autocorner Loss (kg and %) — RESTORED

### What It Was
```
Autocorner Loss (kg) = Autocorner Production − Packing
Autocorner Loss (%)  = (Autocorner − Packing) ÷ Autocorner × 100
```

### Status: RESTORED ✅
The `autocornerKg` field has been added to the production entry form (optional). When entered, the system calculates both Spinning Loss and Autocorner Loss, fully restoring the 2-stage loss analysis from the old system.

---

## ✅ 3.2 — Spinning Loss (as a separate concept from Waste) — RESTORED

### What It Was
```
Spinning Loss (kg) = Production − Autocorner Production
Spinning Loss (%)  = (Production − Autocorner) ÷ Production × 100
```

### Status: RESTORED ✅
Now calculated as `Gross − Autocorner Kg` when autocorner data is entered.


---

## ❌ 3.3 — Per-Frame Daily EB Units & Daily UKG

### What It Was
```
Daily UKG (per frame) = EB Units ÷ Production (kg)
```
Each production entry had an **EB Units** field — the electricity consumed by that specific frame on that specific day. This allowed:
- Per-frame daily UKG calculation
- Daily EB trend charts within monthly dashboard
- "Highest EB Day" and "Best UKG Day" in monthly performance

### Why It's Lost
The new production entry form **does not have a per-row EB Units field**. Electricity is now tracked only at the **monthly level** through the EB Entry page (Opening/Closing meter readings). 

### Impact
- **Daily UKG cannot be calculated** — there is no daily electricity data.
- **Daily EB trend chart is removed** from the monthly dashboard.
- **"Highest EB Day"** performance metric is removed (replaced by "Best Efficiency Day").
- Monthly UKG is still available (uses EB Entry monthly data ÷ total production).

### Why Was This Design Decision Made?
In practice, spinning mills typically only read the factory electricity meter **once per month**. The per-frame daily EB in the old system was often an estimate. The new system uses the actual meter reading for more accurate monthly UKG.

### Could It Be Restored?
Yes — by adding an "EB Units" field to each production row. This would allow daily UKG calculation. However, it would require:
- Adding `ebUnits` column to the `shift_production_entries` table
- Updating validators, services, and frontend entry form
- Deciding if EB is per-row (per machine) or per-day (per shift)

---

## ❌ 3.4 — One-Entry-Per-Frame-Per-Day Constraint

### What It Was
The old system enforced that only **one production entry per frame per day** was allowed. This meant exactly 0, 1, or 2 entries per day (Frame 41 and/or Frame 47).

### Why It's Lost
The new system allows **unlimited rows per day** — multiple siders can work on the same machine, and there can be many rows per count per day. The unique constraint is now based on the row-level ID, not date+frame.

### Impact
- The simple "Frame 41 card + Frame 47 card + Combined" dashboard layout is replaced by a more flexible "Count-wise breakdown" that handles any number of counts.
- The strict 2-frame comparison is replaced by N-count comparison.

### Is This Actually a Loss?
**No — this is an improvement.** The new system is more flexible and can handle any number of machine frames and yarn counts, not just two.

---

# PART 4: NEW FEATURES (Not in Old System)

These features are **new** in the current system and did not exist in the old version:

| # | Feature | Description |
|---|---|---|
| 1 | **Efficiency %** | `(Actual HK ÷ STD HK) × 100` — measures worker/machine performance against standard |
| 2 | **Worked Spindles** | `(Total Spindles − Idle) × (Run Hrs ÷ Shift Hrs)` — accounts for idle spindles and partial shifts |
| 3 | **STD Constant / STD HK** | Standard benchmarks per yarn count — enables efficiency tracking |
| 4 | **Sider Name tracking** | Per-worker accountability per machine per shift |
| 5 | **Batch & Auto-save** | Save individual rows immediately or batch-save all rows |
| 6 | **Multi-row spreadsheet** | Enter all machines in one screen instead of one-by-one |
| 7 | **Stoppages tracking** | Per-row stoppage reasons (power cut, breakdown, etc.) |
| 8 | **Count-wise breakdown** | Flexible N-count grouping instead of fixed 2-frame |

---

# PART 5: COMPLETE FORMULA COMPARISON TABLE

| # | Formula Name | Old System | New System | Status |
|---|---|---|---|---|
| 1 | Gross Production | `Production (kg)` (direct input) | `Actual HK × STD Constant` (calculated) | ✅ Mapped |
| 2 | Net Production | `Packing (kg)` (direct input) | `Gross − Waste Kgs` (calculated) | ✅ Mapped |
| 3 | Spinning Loss (kg) | `Production − Autocorner` | `Gross − Autocorner Kg` | ✅ Restored |
| 4 | Spinning Loss % | `(Prod − Auto) ÷ Prod × 100` | `(Gross − Auto) ÷ Gross × 100` | ✅ Restored |
| 5 | Autocorner Loss (kg) | `Autocorner − Packing` | `Autocorner − Net` | ✅ Restored |
| 6 | Autocorner Loss % | `(Auto − Pack) ÷ Auto × 100` | `(Auto − Net) ÷ Auto × 100` | ✅ Restored |
| 7 | Waste % | Combined via Spinning + Auto loss | `Waste Kgs ÷ Gross × 100` (single stage) | ✅ Mapped |
| 8 | Overall Yield % | `Packing ÷ Production × 100` | `Net ÷ Gross × 100` | ✅ Mapped |
| 9 | UKG (daily) | `EB Units ÷ Production` | N/A (no daily EB) | ❌ Lost |
| 10 | UKG (monthly) | `EB (meter) ÷ Total Prod` | `EB (meter) ÷ Total Gross` | ✅ Mapped |
| 11 | GPS | `Prod ÷ Spindles` | `(Net × 1000) ÷ Worked Spindles` | ✅ Mapped (improved) |
| 12 | Efficiency % | N/A | `Actual HK ÷ STD HK × 100` | ✨ New |
| 13 | Worked Spindles | N/A | `(Total − Idle) × (RunHrs ÷ ShiftHrs)` | ✨ New |
| 14 | Cotton Issue | `Cotton+Fiber+Viscose+Excel` | Same | ✅ Same |
| 15 | Yarn Realisation % | `(Issue−Prod) ÷ Issue × 100` | `Gross ÷ Issue × 100` | ✅ Mapped |
| 16 | Waste % (monthly) | `Waste ÷ Issue × 100` | Same | ✅ Same |
| 17 | Invisible Loss % | `100 − Real − Waste` | Same | ✅ Same |
| 18 | Stock Balance | `SUM(Purchase+Return) − SUM(Issue+Dispatch)` | Same | ✅ Same |
| 19 | EB Consumed | `Closing − Opening` | Same | ✅ Same |

---

# PART 6: DASHBOARD SECTION COMPARISON

## Daily Dashboard

| Section | Old System | New System | Status |
|---|---|---|---|
| Frame/Count Cards | Per-frame: Prod, Auto, Pack, Yield, EB, Spindles, Spin Loss, Auto Loss, UKG, GPS | Per-count: Gross, Net, Waste%, Efficiency, entries | ✅ Mapped |
| Combined Totals | 12 KPIs including all loss types | KPIs: Gross, Net, Waste, Efficiency, Yield, Total Lost, Entries, Avg/Count | ✅ Mapped |
| Frame Comparison Chart | F41 vs F47 bar chart | Count comparison bar chart | ✅ Mapped |
| Efficiency Comparison | Which frame has lower loss, better UKG | Which count has best efficiency, lowest waste, highest production | ✅ Mapped |
| Remarks | Per-frame remarks | Per-row stoppages | ✅ Mapped |
| Stock Position | Opening/Closing per material | Same | ✅ Same |
| Per-frame daily UKG | UKG per frame | N/A | ❌ Lost |
| Per-frame daily EB | EB per frame | N/A | ❌ Lost |

## Monthly Dashboard

| Section | Old System | New System | Status |
|---|---|---|---|
| Production Summary | F41 (%), F47 (%), Total, Avg Daily, Total Packing | Count breakdown (%), Total, Avg Daily, Total Packing (=Net) | ✅ Mapped |
| Loss Analysis | Spinning Loss %, Autocorner Loss %, Yield %, Total Lost, EB | Waste %, Yield %, Total Lost | ⚠️ Partial (no 2-stage loss) |
| Energy | UKG, Days, Total Autocorner | UKG, EB Units, Days | ✅ Mapped |
| Raw Materials | Cotton, Fiber, Viscose, Excel, Total | Same | ✅ Same |
| Realisation & Waste | Realisation %, Waste %, Invisible Loss %, Raw Mat Eff % | Same + Raw Material Efficiency % | ✅ Same |
| Charts | Prod by Frame, Realisation donut | Prod by Count, Realisation donut | ✅ Mapped |
| Day Performance | Best Day, Lowest Day, Highest EB Day, Best UKG Day | Best Day, Lowest Day, Best Efficiency Day | ⚠️ Partial (no daily EB/UKG) |
| Daily Trend | Prod/Auto/Pack trend line | Gross/Net/Waste trend line | ✅ Mapped |
| EB Trend | Daily EB line chart | N/A (no daily EB) | ❌ Lost |
| Day-by-Day Table | Day, Prod, Auto, Pack, Spin Loss, Total Loss, EB, UKG, GPS | Day, Gross, Net, Waste, Waste%, Yield%, Efficiency% | ✅ Mapped |

## Yearly Dashboard

| Section | Old System | New System | Status |
|---|---|---|---|
| Annual Production | Total Prod, F41, F47, Packing, Avg Monthly | Gross, Net, Waste, Avg Monthly, Active Months, Yield, Packing, Total Lost, Days | ✅ Mapped (expanded) |
| Loss & Efficiency | Spin Loss %, Auto Loss %, Yield, Months, Days | Waste %, Yield %, Active Months | ⚠️ Partial (no 2-stage loss) |
| Energy | Total EB, Avg UKG, Avg Monthly EB, Best UKG Month | Same + Worst UKG Month | ✅ Mapped |
| Realisation | Cotton Issued, Other, Real %, Waste %, Inv Loss % | Same | ✅ Same |
| Highlights | Best Month, Lowest Month, Avg Daily, Total Lost, Worst UKG | Same + Best/Worst UKG Month | ✅ Mapped |
| Charts | Monthly bar, Realisation/Waste/Loss trends | Same | ✅ Same |
| Monthly Table | Month, Total, F41, F47, Pack, Spin%, Auto%, Real%, Waste%, InvLoss%, EB, UKG, Days | Month, Gross, Net, Waste, Yield%, Eff%, Real%, Waste%, InvLoss%, EB, UKG, Days | ✅ Mapped |

---

# PART 7: SUMMARY FOR CLIENT

## What the client needs to know:

### "We upgraded the production tracking system. Here's what changed:"

1. **The way production data is entered has improved.** Instead of entering one number per machine per day, operators now enter detailed shift data for each worker on each machine. This gives you **per-worker accountability** and **efficiency tracking against standards**.

2. **Almost everything from the old reports is still available**, just calculated differently. Overall Yield, Total Lost, UKG, GPS, Stock Position, Realisation, Waste Analysis — all preserved.

3. **Three things from old reports are no longer available:**
   - **Spinning Loss vs Autocorner Loss breakdown** — you now see a single "Waste" number instead of two separate loss stages. The total loss amount is the same, just not split into two.
   - **Daily EB/UKG** — electricity is now tracked monthly (from meter readings) instead of per-machine daily. Monthly UKG is still available and actually more accurate since it uses real meter readings.
   - **Daily EB trend chart** — removed because daily EB data isn't collected anymore.

4. **New analytics that didn't exist before:**
   - **Efficiency %** — how well each worker/machine performed vs the standard
   - **Worked Spindles** — actual spindle utilisation accounting for idle spindles and run hours
   - **Stoppages tracking** — reasons for machine stoppages
   - **Best/Worst performance comparisons** across counts and days

### Bottom Line
> The new system trades **2-stage loss breakdown** for **much richer per-machine, per-worker tracking with efficiency benchmarking**. All financial and material tracking (stock, realisation, waste analysis) remains identical.

---

*Document generated from analysis of SpinLytics old (frame-based) and new (shift-based) codebases.*
