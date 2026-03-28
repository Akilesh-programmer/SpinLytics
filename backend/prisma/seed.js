/**
 * SpinLytics — Database Seed Script
 *
 * Generates realistic sample data for development and testing:
 * - 30 days of production entries (both frames)
 * - 50+ stock transactions across materials
 * - 20+ packing entries
 * - 15+ dispatch entries
 * - 3 months of EB entries
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ─── Helpers ──────────────────────────────────────

function randomBetween(min, max) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(3));
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function dateStr(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

const PARTIES = [
  'Rajesh Textiles', 'Shree Yarn Mills', 'Kumar Fabrics',
  'Patel Cotton Traders', 'Singh Fiber Co.', 'Lakshmi Enterprises',
  'Bharath Spinning', 'Mahesh Trading Co.',
];

const LOT_NOS = ['LOT-001', 'LOT-002', 'LOT-003', 'LOT-004', 'LOT-005',
  'LOT-006', 'LOT-007', 'LOT-008', 'LOT-009', 'LOT-010'];

const YARN_TYPES = ['20s Count', '30s Count', '40s Count', '60s Count', 'Combed 40s'];

// ─── Seed Functions ───────────────────────────────

async function seedProduction() {
  console.log('🔄 Seeding production entries...');
  const entries = [];

  for (let i = 0; i < 30; i++) {
    const date = dateStr(i);

    // Frame 41
    const prod41 = randomBetween(800, 1200);
    const auto41 = randomBetween(prod41 * 0.92, prod41 * 0.98);
    const pack41 = randomBetween(auto41 * 0.95, auto41 * 0.99);

    entries.push({
      date: new Date(date),
      frameNumber: 'FRAME_41',
      productionKg: prod41,
      autocornerProductionKg: auto41,
      packingKg: pack41,
      ebUnits: randomBetween(300, 500),
      noOfSpindles: randomInt(400, 500),
      remarks: i === 0 ? 'Regular production day' : null,
    });

    // Frame 47
    const prod47 = randomBetween(600, 1000);
    const auto47 = randomBetween(prod47 * 0.91, prod47 * 0.97);
    const pack47 = randomBetween(auto47 * 0.94, auto47 * 0.98);

    entries.push({
      date: new Date(date),
      frameNumber: 'FRAME_47',
      productionKg: prod47,
      autocornerProductionKg: auto47,
      packingKg: pack47,
      ebUnits: randomBetween(250, 400),
      noOfSpindles: randomInt(350, 450),
      remarks: null,
    });
  }

  await prisma.productionEntry.createMany({ data: entries });
  console.log(`   ✅ Created ${entries.length} production entries`);
}

async function seedStockTransactions() {
  console.log('🔄 Seeding stock transactions...');
  const transactions = [];
  const materials = ['COTTON', 'VISCOSE', 'FIBER', 'EXCEL'];

  // Purchases (inflow)
  for (let i = 0; i < 20; i++) {
    const material = materials[randomInt(0, materials.length - 1)];
    const bags = randomBetween(5, 30);
    const pricePerBag = randomBetween(2000, 5000);

    transactions.push({
      date: new Date(dateStr(randomInt(0, 30))),
      materialType: material,
      transactionType: 'PURCHASE',
      lotNo: LOT_NOS[randomInt(0, LOT_NOS.length - 1)],
      partyName: PARTIES[randomInt(0, PARTIES.length - 1)],
      bags,
      kgs: bags * 60,
      pricePerBag,
      totalPrice: parseFloat((bags * pricePerBag).toFixed(2)),
      remarks: null,
    });
  }

  // Issues (outflow to production)
  for (let i = 0; i < 15; i++) {
    const material = materials[randomInt(0, materials.length - 1)];
    const bags = randomBetween(2, 10);

    transactions.push({
      date: new Date(dateStr(randomInt(0, 25))),
      materialType: material,
      transactionType: 'ISSUE',
      lotNo: LOT_NOS[randomInt(0, LOT_NOS.length - 1)],
      partyName: 'Internal - Production',
      bags,
      kgs: bags * 60,
      pricePerBag: null,
      totalPrice: null,
      remarks: 'Issued to production floor',
    });
  }

  // Returns
  for (let i = 0; i < 5; i++) {
    const material = materials[randomInt(0, materials.length - 1)];
    const bags = randomBetween(1, 5);

    transactions.push({
      date: new Date(dateStr(randomInt(0, 20))),
      materialType: material,
      transactionType: 'RETURN',
      lotNo: LOT_NOS[randomInt(0, 5)],
      partyName: 'Internal - Production',
      bags,
      kgs: bags * 60,
      pricePerBag: null,
      totalPrice: null,
      remarks: 'Returned from production',
    });
  }

  // Waste transactions
  for (let i = 0; i < 8; i++) {
    const bags = randomBetween(0.5, 3);
    transactions.push({
      date: new Date(dateStr(randomInt(0, 25))),
      materialType: 'WASTE',
      transactionType: 'PURCHASE', // Waste generated = "incoming" waste
      lotNo: LOT_NOS[randomInt(0, 5)],
      partyName: 'Internal - Production',
      bags,
      kgs: bags * 60,
      pricePerBag: null,
      totalPrice: null,
      remarks: 'Production waste',
    });
  }

  // Yarn stock (from production)
  for (let i = 0; i < 10; i++) {
    const bags = randomBetween(3, 15);
    const pricePerBag = randomBetween(3000, 6000);

    transactions.push({
      date: new Date(dateStr(randomInt(0, 25))),
      materialType: 'YARN',
      transactionType: 'PURCHASE',
      lotNo: LOT_NOS[randomInt(0, LOT_NOS.length - 1)],
      partyName: 'Internal - Production',
      bags,
      kgs: bags * 60,
      pricePerBag,
      totalPrice: parseFloat((bags * pricePerBag).toFixed(2)),
      remarks: 'Yarn from production',
    });
  }

  await prisma.stockTransaction.createMany({ data: transactions });
  console.log(`   ✅ Created ${transactions.length} stock transactions`);
}

async function seedPackingEntries() {
  console.log('🔄 Seeding packing entries...');
  const entries = [];

  for (let i = 0; i < 25; i++) {
    const bags = randomBetween(3, 15);
    entries.push({
      date: new Date(dateStr(randomInt(0, 28))),
      source: Math.random() > 0.5 ? 'AUTOCORNER' : 'PRODUCTION',
      yarnType: YARN_TYPES[randomInt(0, YARN_TYPES.length - 1)],
      bags,
      kgs: bags * 60,
      lotNo: LOT_NOS[randomInt(0, LOT_NOS.length - 1)],
      remarks: null,
    });
  }

  await prisma.packingEntry.createMany({ data: entries });
  console.log(`   ✅ Created ${entries.length} packing entries`);
}

async function seedDispatchEntries() {
  console.log('🔄 Seeding dispatch entries...');
  const entries = [];

  for (let i = 0; i < 15; i++) {
    const bags = randomBetween(2, 8);
    const pricePerBag = randomBetween(3500, 6500);

    entries.push({
      date: new Date(dateStr(randomInt(0, 25))),
      materialType: 'YARN',
      lotNo: LOT_NOS[randomInt(0, LOT_NOS.length - 1)],
      partyName: PARTIES[randomInt(0, PARTIES.length - 1)],
      bags,
      kgs: bags * 60,
      pricePerBag,
      totalPrice: parseFloat((bags * pricePerBag).toFixed(2)),
      remarks: null,
    });
  }

  await prisma.dispatchEntry.createMany({ data: entries });
  console.log(`   ✅ Created ${entries.length} dispatch entries`);
}

async function seedEBEntries() {
  console.log('🔄 Seeding EB entries...');

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const entries = [];
  let prevClosing = randomBetween(10000, 15000);

  for (let i = 2; i >= 0; i--) {
    let month = currentMonth - i;
    let year = currentYear;
    if (month <= 0) {
      month += 12;
      year -= 1;
    }

    const opening = prevClosing;
    const closing = opening + randomBetween(8000, 15000);
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
  console.log('\n🏭 SpinLytics — Database Seeder\n');
  console.log('⚠️  Clearing existing data...\n');

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

  console.log('\n🎉 Seeding complete!\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
