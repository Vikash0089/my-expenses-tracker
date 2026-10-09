require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');
const routes = require('./routes');
const sanitize = require('./middleware/sanitize');
const { notFound, errorHandler } = require('./middleware/error');
const { processDue } = require('./services/recurringService');

const app = express();
app.set('trust proxy', 1);
app.use(helmet());
app.use(
  cors({
    origin: (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map((s) => s.trim()),
    credentials: true,
    exposedHeaders: ['Content-Disposition'],
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(sanitize);

app.get('/api/health', (_req, res) => res.json({ success: true, data: { status: 'ok' } }));
app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

async function start() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
    throw new Error('JWT_SECRET must be set to a long random string (see .env.example).');
  }
  await connectDB();
  processDue().catch((e) => console.error('Recurring job failed', e));
  setInterval(() => processDue().catch((e) => console.error('Recurring job failed', e)), 60 * 60 * 1000);
  const port = process.env.PORT || 5000;
  app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
}

if (require.main === module) {
  start().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}

module.exports = app;
