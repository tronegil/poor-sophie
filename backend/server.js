require('dotenv').config();

const REQUIRED_ENV = ['JWT_SECRET', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_CALLBACK_URL', 'FRONTEND_URL'];
const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length) {
  console.error(`[startup] Missing required env vars: ${missing.join(', ')}`);
  process.exit(1);
}
if (process.env.NODE_ENV === 'production') {
  if (process.env.FRONTEND_URL.includes('localhost')) {
    console.error(`[startup] FRONTEND_URL is set to "${process.env.FRONTEND_URL}" in production — must be the production domain`);
    process.exit(1);
  }
  if (process.env.GOOGLE_CALLBACK_URL.includes('localhost')) {
    console.error(`[startup] GOOGLE_CALLBACK_URL is set to "${process.env.GOOGLE_CALLBACK_URL}" in production — must be the production domain`);
    process.exit(1);
  }
}

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const passport = require('passport');

require('./src/config/passport');

const authRoutes = require('./src/routes/auth');
const boatRoutes = require('./src/routes/boats');
const userRoutes = require('./src/routes/users');
const maintenanceRoutes = require('./src/routes/maintenance');
const wikiRoutes = require('./src/routes/wiki');
const chatRoutes = require('./src/routes/chat');
const adminRoutes = require('./src/routes/admin');
const passageRoutes = require('./src/routes/passage');
const publicPassageRoutes = require('./src/routes/publicPassage');

const app = express();

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(cookieParser());
app.use(passport.initialize());

// Public URLs are /api/*; Express routes are mounted without the prefix.
// Vercel services pass the original path through, the Vite dev proxy strips
// it, and Google's OAuth callback hits the backend port directly with the
// prefix intact — so strip it here for every environment.
app.use((req, _res, next) => {
  if (req.url === '/api' || req.url.startsWith('/api/') || req.url.startsWith('/api?')) req.url = req.url.slice(4) || '/';
  next();
});

app.use('/auth', authRoutes);
app.use('/boats', boatRoutes);
app.use('/boats/:boatId/maintenance', maintenanceRoutes);
app.use('/boats/:boatId/wiki', wikiRoutes);
app.use('/boats/:boatId/chat', chatRoutes);
app.use('/boats/:boatId/passage', passageRoutes);
app.use('/passage', publicPassageRoutes); // public, no auth — landing page
app.use('/users', userRoutes);
app.use('/admin', adminRoutes);
app.get('/health', (_req, res) => res.json({ ok: true }));

// In serverless (Vercel) the exported app is used directly — no listener needed
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
