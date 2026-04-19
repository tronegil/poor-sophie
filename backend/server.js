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

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '20mb' }));
app.use(cookieParser());
app.use(passport.initialize());

app.use('/api/auth', authRoutes);
app.use('/api/boats', boatRoutes);
app.use('/api/boats/:boatId/maintenance', maintenanceRoutes);
app.use('/api/boats/:boatId/wiki', wikiRoutes);
app.use('/api/users', userRoutes);
app.get('/api/health', (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
