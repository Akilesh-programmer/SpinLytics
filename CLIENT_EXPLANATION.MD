# SpinLytics — How The System Works

### (For Client Review & Verification)

---

# PART 1: WHAT DATA IS ENTERED

The system has **5 data entry forms** on the mobile app. These are the **only** ways data enters the system. Everything else (all percentages, reports, dashboards) is calculated automatically from this entered data.

---

## 1.1 — Production Entry (Entered once per machine per day)

The factory has **two spinning machines**: Frame 41 and Frame 47. Each day, the operator enters the following for **each frame separately**:

| What is entered                | What it means                                          | Example         |
| ------------------------------ | ------------------------------------------------------ | --------------- |
| **Date**                       | Which day this production happened                     | 28-Apr-2026     |
| **Frame Number**               | Which machine: Frame 41 or Frame 47                    | Frame 41        |
| **Production (kg)**            | Total yarn produced by the spinning machine            | 500 kg          |
| **Autocorner Production (kg)** | Yarn that went through the autocorner winding process  | 480 kg          |
| **Packing (kg)**               | Yarn that was actually packed into bags (final output) | 470 kg          |
| **EB Units**                   | Electricity consumed by this frame on this day         | 120 units       |
| **No. of Spindles**            | How many spindles were running on the machine          | 200             |
| **Remarks**                    | Any notes (power cut, machine breakdown, etc.)         | "Power cut 3pm" |

**Important Rule:** The system enforces that **Packing ≤ Autocorner ≤ Production** — you cannot pack more than what came out of autocorner, and autocorner cannot exceed what was produced. The system will reject the entry if this rule is broken.

**Duplicate Prevention:** Only **one entry per frame per day** is allowed. If Frame 41 data for 28-Apr is already entered, the system blocks a second entry for the same date and frame.

---

## 1.2 — Stock Entry (Entered whenever materials move in/out)

Every time raw materials arrive, are sent to production, or returned — a stock entry is created.

| What is entered      | What it means                                                | Example        |
| -------------------- | ------------------------------------------------------------ | -------------- |
| **Date**             | When the transaction happened                                | 28-Apr-2026    |
| **Material Type**    | What material: Cotton, Viscose, Fiber, Excel, Yarn, or Waste | Cotton         |
| **Transaction Type** | What happened — see table below                              | Purchase       |
| **Lot No**           | Which lot/batch this belongs to                              | LOT-2026-042   |
| **Party Name**       | Which supplier or buyer                                      | "ABC Textiles" |
| **Bags**             | How many bags                                                | 10 bags        |
| **Price per Bag**    | Cost per bag (optional)                                      | ₹5,000         |

### Transaction Types:

| Transaction Type | What it means                                            | Effect on Stock     |
| ---------------- | -------------------------------------------------------- | ------------------- |
| **Purchase**     | Raw material bought from supplier                        | Stock **increases** |
| **Issue**        | Raw material sent from warehouse to the production floor | Stock **decreases** |
| **Return**       | Material returned back to stock                          | Stock **increases** |

> **Note:** Dispatch is NOT available on the Stock Entry page. All dispatches go through the dedicated **Dispatch Entry** page (Section 1.4), which automatically creates the stock transaction. This prevents accidental double-counting.

**Automatic Conversion:** The operator enters **bags** — the system automatically converts to KG:

```
KG = Bags × 60       (1 bag = 60 kg, always)
```

**Safety Check:** Before allowing an Issue, the system checks whether there is enough stock. If someone tries to issue 600 kg of Cotton but only 300 kg is in stock, the system rejects it with: _"Insufficient stock for COTTON. Available: 300.000 kg, Requested: 600.000 kg"_.

---

## 1.3 — Packing Entry (Records what gets packed)

| What is entered | What it means                                          |
| --------------- | ------------------------------------------------------ |
| **Date**        | Packing date                                           |
| **Source**      | Where the yarn came from: Autocorner or Production     |
| **Yarn Type**   | Type of yarn                                           |
| **Bags**        | How many bags packed (auto-converted to KG: Bags × 60) |
| **Lot No**      | Which lot it belongs to                                |

**Purpose:** Packing records connect production to stock — they show how much yarn was packed and ready for dispatch.

> **Why does "Packing" appear in both Production Entry and Packing Entry?** They serve different purposes:
>
> - **Production Entry → Packing (kg):** A production metric — how much of this frame's output was packed. Used to calculate **Autocorner Loss** (Autocorner − Packing). All loss calculations and reports use this value.
> - **Packing Entry page:** A detailed packing log — records which yarn type, which lot, how many bags. Used for inventory tracking and dispatch preparation. This is NOT used in loss calculations.

---

## 1.4 — Dispatch Entry (Records goods sent out)

| What is entered | What it means                                   |
| --------------- | ----------------------------------------------- |
| **Date**        | Dispatch date                                   |
| **Material**    | What is being dispatched (usually Yarn)         |
| **Lot No**      | Which lot                                       |
| **Party**       | Who is the buyer                                |
| **Bags**        | How many bags (auto-converted to KG: Bags × 60) |
| **Price**       | Selling price per bag                           |

**Important Behaviour:** When a dispatch is entered, the system does **two things together**:

1. Creates the dispatch record
2. **Automatically creates a stock transaction** (type: Dispatch) to reduce the stock

Both happen together — if one fails, neither is saved. This ensures stock always stays accurate.

---

## 1.5 — EB Entry (Monthly electricity reading)

| What is entered   | What it means                                                             | Example |
| ----------------- | ------------------------------------------------------------------------- | ------- |
| **Month**         | Which month                                                               | April   |
| **Year**          | Which year                                                                | 2026    |
| **Opening Units** | Meter reading at the start of the month (auto-filled from previous month) | 10,000  |
| **Closing Units** | Meter reading at the end of the month                                     | 15,000  |

**Smart auto-fill:** When you select a month, the system automatically checks the previous month's EB entry. If it exists, the Opening Units are **auto-filled** from the previous month's Closing Units (e.g., _"Auto-filled from March 2026 closing (15000)"_). If no previous month data exists, you enter Opening Units manually. You can always tap to override the auto-filled value.

Only **one entry per month** is allowed.

---

# PART 2: HOW DATA IS CLASSIFIED

## 2.1 — Material Types

| Type        | What it is            |
| ----------- | --------------------- |
| **Cotton**  | Raw cotton fiber      |
| **Viscose** | Viscose fiber         |
| **Fiber**   | Other fibers          |
| **Excel**   | Excel fiber/material  |
| **Yarn**    | Finished yarn product |
| **Waste**   | Production waste      |

Cotton, Viscose, Fiber, and Excel are **raw materials**. These four are added together to calculate the **Cotton Issue** (total raw material input) in monthly reports.

## 2.2 — Frame Numbers

| Frame        | Meaning                 |
| ------------ | ----------------------- |
| **Frame 41** | First spinning machine  |
| **Frame 47** | Second spinning machine |

Each frame has its own production data. They are stored separately and combined only in reports.

---

# PART 3: ALL FORMULAS USED

> **Every formula listed here matches exactly with the code. Verified.**

## 3.1 — Daily Production Formulas (calculated for each frame)

| Formula Name                | How It Is Calculated                         | Example                                  |
| --------------------------- | -------------------------------------------- | ---------------------------------------- |
| **Spinning Loss (kg)**      | Production − Autocorner                      | 500 − 480 = **20 kg lost** in spinning   |
| **Spinning Loss %**         | (Production − Autocorner) ÷ Production × 100 | (500−480) ÷ 500 × 100 = **4.00%**        |
| **Autocorner Loss (kg)**    | Autocorner − Packing                         | 480 − 470 = **10 kg lost** in autocorner |
| **Autocorner Loss %**       | (Autocorner − Packing) ÷ Autocorner × 100    | (480−470) ÷ 480 × 100 = **2.08%**        |
| **UKG** (Energy Efficiency) | EB Units ÷ Production                        | 120 ÷ 500 = **0.2400**                   |
| **GPS** (Gram per Spindle)  | Production ÷ No. of Spindles                 | 500 ÷ 200 = **2.5000**                   |

> **What UKG means:** Lower UKG = less electricity used per kg of production = **more efficient**.
> **What GPS means:** Higher GPS = more production per spindle = **better machine utilisation**.

## 3.2 — Stock Formula

Stock is **never stored as a running balance**. Instead, every movement (purchase, issue, dispatch, return) is recorded as a transaction. The current stock is always calculated fresh:

```
Current Stock = SUM(all Purchase kg) + SUM(all Return kg) − SUM(all Issue kg) − SUM(all Dispatch kg)
```

**Opening Stock** for a date = all transactions before that date.
**Closing Stock** for a date = all transactions up to and including that date.

The requirement says: `Closing = Opening + Purchase − Issue − Dispatch + Return` — this is exactly what the system does.

## 3.3 — EB Formula

```
EB Units Consumed = Closing Reading − Opening Reading
```

## 3.4 — Monthly Report Formulas

| Formula Name           | How It Is Calculated                                                             |
| ---------------------- | -------------------------------------------------------------------------------- |
| **Total Production**   | Sum of all daily production entries (Frame 41 + Frame 47) for the month          |
| **Cotton Issue**       | Cotton Issued (kg) + Fiber Issued (kg) + Viscose Issued (kg) + Excel Issued (kg) |
| **Yarn Realisation %** | **Total Production ÷ Cotton Issue × 100**                                        |
| **Waste %**            | Waste ÷ Cotton Issue × 100                                                       |
| **Invisible Loss %**   | 100 − Yarn Realisation % − Waste %                                               |
| **Monthly UKG**        | EB Units (from EB entry) ÷ Total Production                                      |

### Worked Example:

Suppose in one month:

- Total Production = 1,020 kg
- Cotton Issued = 1,000 kg, Fiber Issued = 200 kg → Cotton Issue = 1,200 kg
- Waste = 60 kg
- EB Opening = 10,000, EB Closing = 10,500 → EB Units = 500

Then:

```
Yarn Realisation %  = 1020 ÷ 1200 × 100               = 85.00%
Waste %             = 60 ÷ 1200 × 100                 = 5.00%
Invisible Loss %    = 100 − 85.00 − 5.00               = 10.00%
Monthly UKG         = 500 ÷ 1020                       = 0.4902
```

> **What these mean:**
>
> - **Yarn Realisation 85%** = 85% of raw material was successfully converted to yarn
> - **Waste 5%** = 5% of raw material became measurable waste
> - **Invisible Loss 10%** = 10% is unaccounted (moisture evaporation, handling loss, measurement variances)
> - **Yarn Realisation + Waste + Invisible Loss = 100%** (always)

---

# PART 4: HOW DATA IS RELATED (Data Flow)

## Flow 1: Production → Losses

```
Production (kg) entered → compared with Autocorner → compared with Packing
                        → Spinning Loss calculated   → Autocorner Loss calculated
```

The gap between Production and Autocorner is spinning loss. The gap between Autocorner and Packing is autocorner loss.

## Flow 2: Stock Entry → Stock Balance

```
Every Purchase/Issue/Dispatch/Return → recorded as a transaction
                                     → Stock balance = sum of all transactions
```

Stock is never edited directly. It's always the sum of all recorded movements.

## Flow 3: Dispatch → Stock Reduction

```
Dispatch entered → system creates Dispatch record
                 → system AUTOMATICALLY creates a Stock Transaction (type: DISPATCH)
                 → stock decreases
```

Both records are created together. If one fails, the other is also cancelled.

## Flow 4: Monthly Report Pulls From Multiple Sources

```
Production entries (daily)  ─→ Total Production, Losses
Stock ISSUE transactions    ─→ Cotton Issue (raw material sent to production)
WASTE stock transactions    ─→ Total Waste
EB entry (monthly)          ─→ EB Units Consumed
                              ↓
                    Monthly Report is generated
                    (Realisation %, Waste %, Invisible Loss %, UKG)
```

## Flow 5: Yearly Report = 12 Monthly Reports Combined

```
January summary + February summary + ... + December summary
                              ↓
                    Yearly totals and trends
```

## Flow 6: EB → UKG

```
EB entry (Opening, Closing) → EB Units = Closing − Opening
                             → UKG = EB Units ÷ Total Production
```

---

# PART 5: HOW REPORTS ARE GENERATED

## 5.1 — Daily Report

**What it shows:** Production details for one specific date.

**How the system builds it:**

1. Looks up all production entries for the chosen date
2. For **each frame** (41, 47), shows:
   - Production, Autocorner, Packing
   - Spinning Loss and %
   - Autocorner Loss and %
   - UKG (EB ÷ Production)
   - GPS (Production ÷ Spindles)
3. If **both frames** have data, calculates **combined totals**:
   - Total Production = Frame 41 + Frame 47
   - Combined Spinning Loss % using total values
   - Combined UKG using total EB ÷ total production
   - Combined GPS using total production ÷ total spindles
4. Shows **Stock Position**: Opening and Closing stock for each material on that date
5. Shows **Frame Comparison**: side-by-side comparison of which frame had lower losses and better efficiency

---

## 5.2 — Monthly Report

**What it shows:** Complete month's performance with KPIs, charts, and day-by-day table.

**How the system builds it (step by step):**

**Step 1 — Gather Production Data:**

- Gets all production entries for the month
- Adds up: Total Production, Total Autocorner, Total Packing
- Splits by frame: Frame 41 total, Frame 47 total
- Counts how many unique days have data → Days Recorded

**Step 2 — Calculate Production Losses:**

```
Spinning Loss %    = (Total Prod − Total Auto) ÷ Total Prod × 100
Autocorner Loss %  = (Total Auto − Total Pack) ÷ Total Auto × 100
```

**Step 3 — Gather Raw Material Issues:**

- Finds all stock transactions for the month where type = ISSUE
- Adds up: Cotton issued, Fiber issued, Viscose issued, Excel issued
- Cotton Issue = Cotton + Fiber + Viscose + Excel

**Step 4 — Gather Waste:**

- Finds all WASTE-type stock transactions for the month
- Purchases/Returns of waste ADD to waste total
- Issues/Dispatches of waste SUBTRACT from waste total

**Step 5 — Get Electricity:**

- Looks up the EB entry for this month/year
- EB Units = Closing − Opening

**Step 6 — Calculate Key Metrics:**

```
Yarn Realisation %  = Total Production ÷ Cotton Issue × 100
Waste %             = Total Waste ÷ Cotton Issue × 100
Invisible Loss %    = 100 − Yarn Realisation % − Waste %
Monthly UKG         = EB Units ÷ Total Production
```

**The dashboard also shows:**

- Average daily production = Total Production ÷ Days Recorded
- Overall Yield = (Total Packing ÷ Total Production) × 100
- Best production day / Worst production day / Best UKG day
- Day-by-day breakdown table with all metrics
- Production trend chart (line graph of daily production, autocorner, packing)
- EB consumption chart
- Realisation pie chart (Yarn Realisation vs Waste vs Invisible Loss)

---

## 5.3 — Yearly Report

**What it shows:** 12-month overview with totals and trends.

**How the system builds it:**

1. Runs the **monthly report logic for each of the 12 months**
2. Adds up yearly totals:

```
Yearly Production       = Sum of all 12 monthly productions
Yearly Spinning Loss %  = (Yearly Prod − Yearly Autocorner) ÷ Yearly Prod × 100
Yearly UKG              = Yearly EB ÷ Yearly Prod
Yearly Realisation %    = (Yearly Cotton Issue − Yearly Prod) ÷ Yearly Cotton Issue × 100
Yearly Waste %          = Yearly Waste ÷ Yearly Cotton Issue × 100
Yearly Invisible Loss % = 100 − Realisation − Waste
```

3. Finds: Best month, worst month, best UKG month, worst UKG month
4. Shows: Monthly production bar chart, trend lines, full breakdown table

---

## 5.4 — Stock Report

**What it shows:** Current inventory status.

**How the system builds it:**

For each material type (Cotton, Viscose, Fiber, Excel, Yarn, Waste):

```
Current Stock (kg)   = SUM(Purchase + Return) − SUM(Issue + Dispatch)
Current Stock (bags) = Current Stock (kg) ÷ 60
```

Also shows:

- **Lot-wise breakdown**: Same calculation grouped by material + lot number (how much stock in each lot)
- **Party-wise breakdown**: Same calculation grouped by material + party name
- **Recent transactions**: Last 20 stock movements

---

# PART 6: SYSTEM RULES & SAFEGUARDS

| Rule                                    | What happens if violated                             |
| --------------------------------------- | ---------------------------------------------------- |
| Packing ≤ Autocorner ≤ Production       | Entry is **rejected**                                |
| One production entry per frame per day  | Second entry is **blocked**                          |
| No negative stock                       | Issue/Dispatch is **rejected** if insufficient stock |
| One EB entry per month                  | Second entry is **blocked**                          |
| Dispatch auto-creates stock deduction   | Both succeed or both fail (never partial)            |
| Bags always converted to KG (× 60)      | Happens automatically at entry                       |
| No calculated values stored in database | Everything is recalculated fresh from raw data       |
| Frames stored separately                | Combined only in report displays                     |

---

# PART 7: COMPLETE FORMULA VERIFICATION TABLE

| #   | Formula from Requirements.MD                               | What the code does                                         | Match? |
| --- | ---------------------------------------------------------- | ---------------------------------------------------------- | ------ |
| 1   | `Spinning Loss = Production - Autocorner`                  | `new Decimal(productionKg).minus(autocornerKg)`            | ✅     |
| 2   | `Spinning Loss % = Loss / Production`                      | `spinningLoss(prod,auto).dividedBy(prod).times(100)`       | ✅     |
| 3   | `Autocorner Loss = Autocorner - Packing`                   | `new Decimal(autocornerKg).minus(packingKg)`               | ✅     |
| 4   | `Autocorner Loss % = Loss / Autocorner`                    | `autocornerLoss(auto,pack).dividedBy(auto).times(100)`     | ✅     |
| 5   | `UKG = EB Units / Production`                              | `new Decimal(ebUnits).dividedBy(prod)`                     | ✅     |
| 6   | `GPS = Production / Spindles`                              | `new Decimal(productionKg).dividedBy(sp)`                  | ✅     |
| 7   | `1 Bag = 60 kg`                                            | `BAG_TO_KG = 60` and `new Decimal(bags).times(60)`         | ✅     |
| 8   | `KG = Bags × 60`                                           | Same as above                                              | ✅     |
| 9   | `Closing = Opening + Purchase - Issue - Dispatch + Return` | `SUM(PURCHASE+RETURN) - SUM(ISSUE+DISPATCH)`               | ✅     |
| 10  | `Opening = Previous Day Closing`                           | All transactions before date                               | ✅     |
| 11  | `EB Units = Closing - Opening`                             | `new Decimal(closingUnits).minus(openingUnits)`            | ✅     |
| 12  | `Total Production = Sum(41 + 47)`                          | Sums both frames' productionKg                             | ✅     |
| 13  | `Cotton Issue = Cotton + Fiber + Viscose + Excel`          | Sums all four raw material ISSUE transactions              | ✅     |
| 14  | `Yarn Realisation % = Total Production / Cotton Issue`     | `new Decimal(totalProduction).dividedBy(issue).times(100)` | ✅     |
| 15  | `Waste % = Waste / Cotton Issue`                           | `new Decimal(wasteKg).dividedBy(issue).times(100)`         | ✅     |
| 16  | `Invisible Loss = 100 - Realisation - Waste`               | `new Decimal(100).minus(realisationPct).minus(wastePct)`   | ✅     |
| 17  | `UKG = EB Units / Total Production` (monthly)              | `calc.ukg(ebUnits, totalProduction)`                       | ✅     |
| 18  | Packing ≤ Autocorner ≤ Production                          | Validated in mobile app + backend                          | ✅     |
| 19  | No negative stock                                          | Pre-transaction check before Issue/Dispatch                | ✅     |
| 20  | No duplicate production entries                            | Unique constraint on date + frame                          | ✅     |
| 21  | Transaction-based stock (never direct update)              | All stock = SUM of transaction records                     | ✅     |
| 22  | Derived values never stored                                | Calculated at query time, not stored                       | ✅     |
| 23  | Store in KG, convert from bags at input only               | bagToKg applied at creation, stored as kgs                 | ✅     |
| 24  | Frame 41 & 47 stored separately                            | Separate records, combined only in reports                 | ✅     |
| 25  | Dispatch reduces stock                                     | Auto-creates stock transaction atomically                  | ✅     |

**All 25 requirements verified. All match. ✅**
