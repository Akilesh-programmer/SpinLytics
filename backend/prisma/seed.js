/**
 * SpinLytics — Comprehensive Database Seed Script
 *
 * Generates 6 months of realistic demo data for client presentation:
 * - 180 days × 2 frames = 360 production entries
 * - 200+ stock transactions (purchases, issues, dispatches, returns, waste)
 * - 120+ packing entries
 * - 80+ dispatch entries with pricing
 * - 6 months of EB (electricity) entries
 *
 * Data features:
 * - Realistic seasonal variation (dip in summer, higher in winter)
 * - Proper material mix ratios (Cotton ~50%, Fiber ~25%, Viscose ~15%, Excel ~10%)
 * - Varied party names and lot numbers
 * - Sunday off simulation (no production on Sundays)
 * - Occasional remarks and notes
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ─── Helpers ──────────────────────────────────────

function rand(min, max) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(3));
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[randInt(0, arr.length - 1)];
}

function dateFromDaysAgo(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isSunday(d) {
  return d.getDay() === 0;
}

// Seasonal multiplier: Oct-Feb = peak, Mar-May = normal, Jun-Sep = slightly lower
function seasonalFactor(month) {
  const factors = {
    1: 1.05, 2: 1.04, 3: 1.0, 4: 0.97, 5: 0.94,
    6: 0.90, 7: 0.88, 8: 0.91, 9: 0.95,
    10: 1.02, 11: 1.06, 12: 1.08,
  };
  return factors[month] || 1.0;
}

// ─── Constants ────────────────────────────────────

const PARTIES = [
  'Rajesh Textiles', 'Shree Yarn Mills', 'Kumar Fabrics',
  'Patel Cotton Traders', 'Singh Fiber Co.', 'Lakshmi Enterprises',
  'Bharath Spinning', 'Mahesh Trading Co.', 'Ganesh Cotton Agency',
  'Sri Venkateshwara Textiles', 'Balaji Fiber Mills', 'Srinivasan Traders',
  'Murugan Yarn Agency', 'Thirumal Cotton Corp', 'Arun Spinning Mills',
];

const RAW_MATERIAL_PARTIES = [
  'Patel Cotton Traders', 'Singh Fiber Co.', 'Ganesh Cotton Agency',
  'Thirumal Cotton Corp', 'Balaji Fiber Mills', 'Srinivasan Traders',
];

const YARN_BUYERS = [
  'Rajesh Textiles', 'Shree Yarn Mills', 'Kumar Fabrics',
  'Lakshmi Enterprises', 'Bharath Spinning', 'Mahesh Trading Co.',
  'Murugan Yarn Agency', 'Arun Spinning Mills', 'Sri Venkateshwara Textiles',
];

const LOT_NOS = [];
for (let i = 1; i <= 30; i++) {
  LOT_NOS.push(`LOT-${String(i).padStart(3, '0')}`);
}

const YARN_TYPES = [
  '20s Count', '30s Count', '40s Count', '60s Count',
  'Combed 40s', 'Combed 60s', 'Carded 30s', 'Compact 40s',
];

const REMARKS_PRODUCTION = [
  null, null, null, null, null, null, null, null, // Most days: no remarks
  'Regular production day', 'Machine maintenance at 3PM',
  'Power cut — 2hr delay', 'Worker shortage — half shift',
  'New lot started', 'High humidity — slower drying',
  'Night shift extended', 'Festival — half day',
  'Quality inspection passed', 'Lot change at noon',
  'Motor repair on F41', 'Breakage issue resolved',
];

const REMARKS_STOCK = [
  null, null, null, null,
  'Quality checked and approved', 'Premium grade',
  'Regular supply', 'Urgent order', 'Advance payment done',
  'Partial delivery', 'From Coimbatore godown',
];

const REMARKS_PACKING = [
  null, null, null,
  'Packed for dispatch', 'Quality A grade',
  'Export quality', 'Standard packing',
];

const REMARKS_DISPATCH = [
  null, null, null,
  'Delivered by truck', 'Transport: Bharath Logistics',
  'Cash on delivery', 'Credit — 30 days', 'Advance received',
  'Urgent shipment', 'Regular monthly order',
];

// ─── Seed Functions ───────────────────────────────

async function seedProduction() {
  console.log('🔄 Seeding production entries (6 months, 2 frames)...');
  const entries = [];
  const DAYS = 180; // ~6 months

  for (let i = 0; i < DAYS; i++) {
    const date = dateFromDaysAgo(i);
    if (isSunday(date)) continue; // Sundays off

    const month = date.getMonth() + 1;
    const sf = seasonalFactor(month);

    // Frame 41 — higher capacity frame
    const prod41 = rand(850 * sf, 1250 * sf);
    const auto41 = rand(prod41 * 0.92, prod41 * 0.98);
    const pack41 = rand(auto41 * 0.94, auto41 * 0.99);
    const eb41 = rand(280 * sf, 480 * sf);

    entries.push({
      date,
      frameNumber: 'FRAME_41',
      productionKg: prod41,
      autocornerProductionKg: auto41,
      packingKg: pack41,
      ebUnits: eb41,
      noOfSpindles: randInt(420, 504),
      remarks: pick(REMARKS_PRODUCTION),
    });

    // Frame 47 — slightly lower capacity
    const prod47 = rand(620 * sf, 1050 * sf);
    const auto47 = rand(prod47 * 0.90, prod47 * 0.97);
    const pack47 = rand(auto47 * 0.93, auto47 * 0.98);
    const eb47 = rand(230 * sf, 420 * sf);

    entries.push({
      date,
      frameNumber: 'FRAME_47',
      productionKg: prod47,
      autocornerProductionKg: auto47,
      packingKg: pack47,
      ebUnits: eb47,
      noOfSpindles: randInt(360, 456),
      remarks: pick(REMARKS_PRODUCTION),
    });
  }

  await prisma.productionEntry.createMany({ data: entries });
  console.log(`   ✅ Created ${entries.length} production entries`);
}

async function seedStockTransactions() {
  console.log('🔄 Seeding stock transactions (200+)...');
  const transactions = [];
  const materials = ['COTTON', 'VISCOSE', 'FIBER', 'EXCEL'];
  // Material weights (Cotton ~50%, Fiber ~25%, Viscose ~15%, Excel ~10%)
  const matWeights = { COTTON: 0.50, FIBER: 0.25, VISCOSE: 0.15, EXCEL: 0.10 };

  // === PURCHASES (raw material inflow) — spread over 6 months ===
  for (let i = 0; i < 80; i++) {
    // Weighted material selection
    const r = Math.random();
    let material;
    if (r < 0.50) material = 'COTTON';
    else if (r < 0.75) material = 'FIBER';
    else if (r < 0.90) material = 'VISCOSE';
    else material = 'EXCEL';

    const bags = rand(5, 40);
    const kgPerBag = material === 'COTTON' ? rand(55, 65) : rand(50, 60);
    const pricePerBag = material === 'COTTON' ? rand(2500, 4500) :
                        material === 'FIBER'  ? rand(2000, 3500) :
                        material === 'VISCOSE'? rand(3000, 5000) :
                                                rand(2200, 3800);

    transactions.push({
      date: dateFromDaysAgo(randInt(0, 180)),
      materialType: material,
      transactionType: 'PURCHASE',
      lotNo: pick(LOT_NOS),
      partyName: pick(RAW_MATERIAL_PARTIES),
      bags,
      kgs: parseFloat((bags * kgPerBag).toFixed(3)),
      pricePerBag,
      totalPrice: parseFloat((bags * pricePerBag).toFixed(2)),
      remarks: pick(REMARKS_STOCK),
    });
  }

  // === ISSUES (raw material outflow to production) ===
  for (let i = 0; i < 60; i++) {
    const r = Math.random();
    let material;
    if (r < 0.50) material = 'COTTON';
    else if (r < 0.75) material = 'FIBER';
    else if (r < 0.90) material = 'VISCOSE';
    else material = 'EXCEL';

    const bags = rand(2, 15);
    const kgPerBag = rand(55, 65);

    transactions.push({
      date: dateFromDaysAgo(randInt(0, 175)),
      materialType: material,
      transactionType: 'ISSUE',
      lotNo: pick(LOT_NOS),
      partyName: 'Internal - Production',
      bags,
      kgs: parseFloat((bags * kgPerBag).toFixed(3)),
      pricePerBag: null,
      totalPrice: null,
      remarks: 'Issued to production floor',
    });
  }

  // === RETURNS (surplus material back from production) ===
  for (let i = 0; i < 15; i++) {
    const material = pick(materials);
    const bags = rand(1, 5);
    const kgPerBag = rand(55, 65);

    transactions.push({
      date: dateFromDaysAgo(randInt(0, 150)),
      materialType: material,
      transactionType: 'RETURN',
      lotNo: pick(LOT_NOS.slice(0, 15)),
      partyName: 'Internal - Production',
      bags,
      kgs: parseFloat((bags * kgPerBag).toFixed(3)),
      pricePerBag: null,
      totalPrice: null,
      remarks: 'Returned from production — surplus',
    });
  }

  // === WASTE transactions ===
  for (let i = 0; i < 25; i++) {
    const bags = rand(0.5, 4);
    const kgPerBag = rand(50, 65);

    transactions.push({
      date: dateFromDaysAgo(randInt(0, 175)),
      materialType: 'WASTE',
      transactionType: 'PURCHASE', // Waste generated = "incoming" waste stock
      lotNo: pick(LOT_NOS.slice(0, 15)),
      partyName: 'Internal - Production',
      bags,
      kgs: parseFloat((bags * kgPerBag).toFixed(3)),
      pricePerBag: null,
      totalPrice: null,
      remarks: 'Production waste collected',
    });
  }

  // === WASTE dispatched (sold) ===
  for (let i = 0; i < 10; i++) {
    const bags = rand(2, 8);
    const kgPerBag = rand(50, 60);
    const pricePerBag = rand(500, 1200);

    transactions.push({
      date: dateFromDaysAgo(randInt(0, 150)),
      materialType: 'WASTE',
      transactionType: 'DISPATCH',
      lotNo: pick(LOT_NOS.slice(0, 10)),
      partyName: pick(['Waste Recyclers Ltd', 'Green Fiber Co.', 'Recycle Hub', 'Sri Waste Traders']),
      bags,
      kgs: parseFloat((bags * kgPerBag).toFixed(3)),
      pricePerBag,
      totalPrice: parseFloat((bags * pricePerBag).toFixed(2)),
      remarks: 'Waste sold',
    });
  }

  // === YARN stock (production output stored) ===
  for (let i = 0; i < 40; i++) {
    const bags = rand(3, 18);
    const kgPerBag = rand(55, 65);
    const pricePerBag = rand(3500, 7000);

    transactions.push({
      date: dateFromDaysAgo(randInt(0, 175)),
      materialType: 'YARN',
      transactionType: 'PURCHASE', // Yarn produced = inflow into yarn stock
      lotNo: pick(LOT_NOS),
      partyName: 'Internal - Production',
      bags,
      kgs: parseFloat((bags * kgPerBag).toFixed(3)),
      pricePerBag,
      totalPrice: parseFloat((bags * pricePerBag).toFixed(2)),
      remarks: 'Yarn from production',
    });
  }

  // === YARN dispatched (sold to buyers) ===
  for (let i = 0; i < 30; i++) {
    const bags = rand(3, 12);
    const kgPerBag = rand(55, 65);
    const pricePerBag = rand(4000, 7500);

    transactions.push({
      date: dateFromDaysAgo(randInt(0, 170)),
      materialType: 'YARN',
      transactionType: 'DISPATCH',
      lotNo: pick(LOT_NOS),
      partyName: pick(YARN_BUYERS),
      bags,
      kgs: parseFloat((bags * kgPerBag).toFixed(3)),
      pricePerBag,
      totalPrice: parseFloat((bags * pricePerBag).toFixed(2)),
      remarks: pick(REMARKS_DISPATCH),
    });
  }

  await prisma.stockTransaction.createMany({ data: transactions });
  console.log(`   ✅ Created ${transactions.length} stock transactions`);
}

async function seedPackingEntries() {
  console.log('🔄 Seeding packing entries (120+)...');
  const entries = [];

  for (let i = 0; i < 130; i++) {
    const date = dateFromDaysAgo(randInt(0, 175));
    if (isSunday(date)) continue;

    const bags = rand(2, 16);
    const kgPerBag = rand(55, 65);
    entries.push({
      date,
      source: Math.random() > 0.45 ? 'AUTOCORNER' : 'PRODUCTION',
      yarnType: pick(YARN_TYPES),
      bags,
      kgs: parseFloat((bags * kgPerBag).toFixed(3)),
      lotNo: pick(LOT_NOS),
      remarks: pick(REMARKS_PACKING),
    });
  }

  await prisma.packingEntry.createMany({ data: entries });
  console.log(`   ✅ Created ${entries.length} packing entries`);
}

async function seedDispatchEntries() {
  console.log('🔄 Seeding dispatch entries (80+)...');
  const entries = [];

  for (let i = 0; i < 85; i++) {
    const date = dateFromDaysAgo(randInt(0, 170));
    if (isSunday(date)) continue;

    // 85% yarn, 10% waste, 5% cotton dispatch
    const r = Math.random();
    let materialType, priceRange;
    if (r < 0.85) {
      materialType = 'YARN';
      priceRange = [3800, 7200];
    } else if (r < 0.95) {
      materialType = 'WASTE';
      priceRange = [400, 1100];
    } else {
      materialType = 'COTTON';
      priceRange = [2800, 4200];
    }

    const bags = rand(2, 12);
    const kgPerBag = rand(55, 65);
    const pricePerBag = rand(priceRange[0], priceRange[1]);

    entries.push({
      date,
      materialType,
      lotNo: pick(LOT_NOS),
      partyName: pick(materialType === 'WASTE' ?
        ['Waste Recyclers Ltd', 'Green Fiber Co.', 'Recycle Hub', 'Sri Waste Traders'] :
        YARN_BUYERS),
      bags,
      kgs: parseFloat((bags * kgPerBag).toFixed(3)),
      pricePerBag,
      totalPrice: parseFloat((bags * pricePerBag).toFixed(2)),
      remarks: pick(REMARKS_DISPATCH),
    });
  }

  await prisma.dispatchEntry.createMany({ data: entries });
  console.log(`   ✅ Created ${entries.length} dispatch entries`);
}

async function seedEBEntries() {
  console.log('🔄 Seeding EB entries (6 months)...');

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const entries = [];
  let prevClosing = rand(10000, 16000);

  // Generate 6 months of EB data
  for (let i = 5; i >= 0; i--) {
    let month = currentMonth - i;
    let year = currentYear;
    while (month <= 0) {
      month += 12;
      year -= 1;
    }

    const sf = seasonalFactor(month);
    const opening = prevClosing;
    const consumed = rand(9000 * sf, 16000 * sf);
    const closing = parseFloat((opening + consumed).toFixed(3));
    prevClosing = closing;

    entries.push({
      month,
      year,
      openingUnits: opening,
      closingUnits: closing,
    });
  }

  await prisma.eBEntry.createMany({ data: entries });
  console.log(`   ✅ Created ${entries.length} EB entries`);
}

// ─── Main ─────────────────────────────────────────

async function main() {
  console.log('\n🏭 SpinLytics — Comprehensive Demo Data Seeder\n');
  console.log('⚠️  Clearing ALL existing data...\n');

  // Clear in reverse dependency order
  await prisma.dispatchEntry.deleteMany();
  await prisma.packingEntry.deleteMany();
  await prisma.stockTransaction.deleteMany();
  await prisma.productionEntry.deleteMany();
  await prisma.eBEntry.deleteMany();

  console.log('   ✅ Database cleared\n');

  await seedProduction();
  await seedStockTransactions();
  await seedPackingEntries();
  await seedDispatchEntries();
  await seedEBEntries();

  // Print summary
  const counts = {
    production: await prisma.productionEntry.count(),
    stock: await prisma.stockTransaction.count(),
    packing: await prisma.packingEntry.count(),
    dispatch: await prisma.dispatchEntry.count(),
    eb: await prisma.eBEntry.count(),
  };

  console.log('\n📊 Final Data Summary:');
  console.log(`   Production Entries: ${counts.production}`);
  console.log(`   Stock Transactions: ${counts.stock}`);
  console.log(`   Packing Entries:    ${counts.packing}`);
  console.log(`   Dispatch Entries:   ${counts.dispatch}`);
  console.log(`   EB Entries:         ${counts.eb}`);
  console.log(`   TOTAL RECORDS:      ${Object.values(counts).reduce((a, b) => a + b, 0)}`);
  console.log('\n🎉 Demo data seeding complete! Ready for client presentation.\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
