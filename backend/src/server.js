const config = require('./config');
const app = require('./app');
const prisma = require('./config/database');

const PORT = config.port;

async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    app.listen(PORT, () => {
      console.log(`\n🏭 SpinLytics API Server`);
      console.log(`   Environment: ${config.nodeEnv}`);
      console.log(`   Port:        ${PORT}`);
      console.log(`   URL:         http://localhost:${PORT}`);
      console.log(`   Health:      http://localhost:${PORT}/api/v1/health`);
      console.log(`\n📦 Available Modules:`);
      console.log(`   Production:  /api/v1/production`);
      console.log(`   Stock:       /api/v1/stock`);
      console.log(`   Packing:     /api/v1/packing`);
      console.log(`   Dispatch:    /api/v1/dispatch`);
      console.log(`   EB:          /api/v1/eb`);
      console.log(`   Dashboard:   /api/v1/dashboard`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
