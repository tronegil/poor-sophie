require('dotenv').config();
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

app.use('/auth', authRoutes);
app.use('/boats', boatRoutes);
app.use('/boats/:boatId/maintenance', maintenanceRoutes);
app.use('/boats/:boatId/wiki', wikiRoutes);
app.use('/boats/:boatId/chat', chatRoutes);
app.use('/users', userRoutes);
app.get('/health', (_req, res) => res.json({ ok: true }));

// In serverless (Vercel) the exported app is used directly — no listener needed
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
