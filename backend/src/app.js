const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ─── Security ─────────────────────────────────────
app.use(helmet());

// ─── CORS ─────────────────────────────────────────
app.use(cors({
  origin: '*', // TODO: Restrict in production
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Body Parsing ─────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Logging ──────────────────────────────────────
app.use(morgan('dev'));

// ─── API Routes ───────────────────────────────────
app.use('/api/v1', routes);

// ─── Root ─────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'SpinLytics API v1.0.0',
    docs: '/api/v1/health',
  });
});

// ─── 404 Handler ──────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// ─── Global Error Handler ─────────────────────────
app.use(errorHandler);

module.exports = app;
