'use strict';

require('dotenv').config();

const express = require('express');
const nunjucks = require('nunjucks');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const rateLimit = require('express-rate-limit');
const path = require('path');

const publicRenders = require('./routes/public/renders');
const publicApi     = require('./routes/public/api');
const adminRenders  = require('./routes/admin/renders');
const adminApi      = require('./routes/admin/api');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Template Engine ───────────────────────────────────────────────────────────

const nunjucksEnv = nunjucks.configure(path.join(__dirname, 'views'), {
  autoescape: true,
  express: app,
  watch: process.env.NODE_ENV === 'development',
});

// Make app URL and current year available in every template
nunjucksEnv.addGlobal('appUrl', process.env.APP_URL || 'http://localhost:3000');
nunjucksEnv.addGlobal('currentYear', new Date().getFullYear());

// Format a date for display — used in templates as {{ date | dateFormat }}
nunjucksEnv.addFilter('dateFormat', (value, format) => {
  if (!value) return '';
  const date = new Date(value);
  if (format === 'short') {
    return date.toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  if (format === 'datetime') {
    return date.toLocaleString('en-IE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString('en-IE', { day: 'numeric', month: 'long', year: 'numeric' });
});

// Time ago filter — e.g. "3 hours ago"
nunjucksEnv.addFilter('timeAgo', (value) => {
  if (!value) return '';
  const seconds = Math.floor((Date.now() - new Date(value)) / 1000);
  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
  ];
  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) return `${count} ${interval.label}${count !== 1 ? 's' : ''} ago`;
  }
  return 'just now';
});

// Currency filter — e.g. {{ 99.99 | currency }} → "€99.99"
nunjucksEnv.addFilter('currency', (value) => {
  if (value === null || value === undefined) return '';
  return `€${Number(value).toFixed(2)}`;
});

// WhatsApp filter — strips non-digits for wa.me URLs e.g. "+353 87 123 4567" → "353871234567"
nunjucksEnv.addFilter('whatsapp', (value) => {
  if (!value) return '';
  return String(value).replace(/\D/g, '');
});

app.set('view engine', 'njk');

// ─── Middleware ────────────────────────────────────────────────────────────────

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Sessions — stored in PostgreSQL via connect-pg-simple
app.use(session({
  store: new PgSession({
    conString: process.env.DATABASE_URL,
    tableName: 'session',
    schemaName: 'rental',
    createTableIfMissing: true,
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 8 * 60 * 60 * 1000, // 8 hours
  },
}));

// Make session user available in every template
app.use((req, res, next) => {
  res.locals.sessionUser = req.session.user || null;
  next();
});

// ─── Routes ───────────────────────────────────────────────────────────────────

// Public site
app.use('/', publicRenders);
app.use('/api', publicApi);

// Admin backend
app.use('/admin', adminRenders);
app.use('/admin', adminApi);

// ─── Error Handling ───────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).send('404 — Page not found');
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong';
  res.status(status).send(message);
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
