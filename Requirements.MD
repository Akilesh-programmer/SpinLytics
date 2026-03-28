# 🏭 SpinLytics

---

## 📌 Overview

This system digitizes and automates a textile production workflow involving:

- Production tracking (frame-based)
- Inventory & stock management
- Packing & dispatch tracking
- Costing & efficiency calculations
- Daily → Monthly → Yearly reporting

The system replaces Excel-based workflows with a **consistent, transaction-safe, and scalable architecture**.

Reference logic derived from:

---

# 🧠 System Modules

## 🔹 1. Production Module

- Machine-level tracking (Frame 41, 47)
- Calculates:
    - Spinning Loss
    - Autocorner Loss
    - GPS (Gram per Spindle)
    - UKG (Energy efficiency)

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

---

# 📱 Application Structure

## 📱 Mobile App (Data Entry)

---

### 🔹 Page 1: Production Entry

**Inputs:**

- Date
- Frame No (41 / 47)
- Production (kg)
- Autocorner Production (kg)
- Packing (kg)
- EB Units (daily)
- No. of spindles
- Remarks

**Calculations:**

```
Spinning Loss = Production - Autocorner
Spinning Loss % = Loss / Production

Autocorner Loss = Autocorner - Packing
Autocorner Loss % = Loss / Autocorner

UKG = EB Units / Production (Frame 41)
GPS = Production / Spindles
```

---

### 🔹 Page 2: Stock Entry

**Inputs:**

- Date
- Material Type
- Transaction Type (Purchase / Issue / Dispatch / Return)
- Lot No
- Party Name
- Bags
- Price

**Calculations:**

```
1 Bag = 60 kg
KG = Bags × 60

Closing = Opening + Purchase - Issue - Dispatch + Return
Opening = Previous Day Closing
```

---

### 🔹 Page 3: Packing Entry (Core Integration)

**Inputs:**

- Date
- Source (Autocorner / Production)
- Yarn
- Bags
- Lot No

**Purpose:**

- Updates stock
- Used in loss calculations
- Feeds dispatch

---

### 🔹 Page 4: Dispatch Entry

**Inputs:**

- Date
- Material
- Lot No
- Party
- Bags
- Price

**Effects:**

- Reduces stock
- Converts bags → kg

---

### 🔹 Page 5: EB Entry

**Inputs:**

- Month
- Opening Units
- Closing Units

**Calculation:**

```
EB Units = Closing - Opening
```

---

# 💻 Web Dashboard

---

### 🔹 Page 6: Daily Dashboard

Displays:

- Production (41, 47)
- Total Production
- Spinning Loss %
- Autocorner Loss %
- UKG
- GPS
- Remarks

---

### 🔹 Page 7: Monthly Dashboard

**Calculations:**

```
Total Production = Sum(41 + 47)

Cotton Issue = Cotton + Fiber + Viscose + Excel

Yarn Realisation % = (Cotton Issue - Production) / Cotton Issue

Waste % = Waste / Cotton Issue

Invisible Loss = 100 - Realisation - Waste

UKG = EB Units / Total Production
```

---

### 🔹 Page 8: Yearly Dashboard

- Aggregated monthly data

---

### 🔹 Page 9: Stock Dashboard

Displays:

- Current stock
- Lot-wise tracking
- Party-wise tracking
- Transaction history

---

# 🔄 Data Flow Architecture

---

### 🔁 Flow 1: Production → Stock

```
Production → Autocorner → Packing → Stock Increase
```

---

### 🔁 Flow 2: Stock → Production

```
Stock Issue → Production → Monthly Calculation
```

---

### 🔁 Flow 3: Stock → Dispatch

```
Stock → Dispatch → Stock Decrease
```

---

### 🔁 Flow 4: EB → Metrics

```
EB → UKG (Daily & Monthly)
```

---

# 🧮 Core Principles

---

### ⚙️ 1. Transaction-Based System (CRITICAL)

- Never update stock directly
- Always insert transactions

**Example Table:**

```
stock_transactions:
- type
- material
- kg
- lot_no
- date
```

**Stock Calculation:**

```
SUM(kg)
```

---

### ⚙️ 2. Do NOT Store Derived Values

Always calculate dynamically:

- Loss %
- UKG
- GPS
- Realisation %

---

### ⚙️ 3. Units Consistency

- Store everything in KG
- Convert from bags only at input layer

---

### ⚙️ 4. Data Integrity Rules

- Packing ≤ Autocorner ≤ Production
- No negative stock

---

### ⚙️ 5. Frame Separation

- Store Frame 41 & 47 separately
- Combine only in reports

---

# 📱 Mobile App Considerations

- Offline support (local storage + sync)
- Fast input UX (dropdowns, defaults)
- Prevent duplicate entries

---

# 💻 Web Considerations

- Heavy aggregation queries
- Filters (date, frame, material)
- No strict real-time requirement

---

# 🧱 Tech Stack

### 🎨 Frontend

- React (Web Dashboard)
- React Native (Mobile App)

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

- Accurate production tracking
- Reliable inventory management
- Consistent costing calculations
- Elimination of Excel-based errors