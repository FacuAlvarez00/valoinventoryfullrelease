require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./database');
const authRoutes = require('./routes/auth');
const catalogCache = require('./services/catalogCache');

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || '*';

// --- Middleware
app.use(cors({
  origin: FRONTEND_ORIGIN,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);

// Cached catalog: skins, weapons, chromas, skin levels, prices, ranked
// seasons, competitive tiers, maps, and agents
app.get('/api/catalog', (req, res) => {
  if (!catalogCache.isReady()) {
    return res.status(503).json({ success: false, message: 'The catalog is loading. Try again in a few seconds.' });
  }
  const { weapons, skins, chromas, skinlevels, weaponSkins, seasons, competitiveTiers, maps, agents, lastUpdated } = catalogCache.get();
  res.json({ success: true, weapons, skins, chromas, skinlevels, weaponSkins, seasons, competitiveTiers, maps, agents, lastUpdated });
});

// Health check
app.get('/health', (req, res) => res.status(200).json({ ok: true }));

// --- Info
app.get('/', (req, res) => {
  res.json({
    message: 'Valorant Inventory Backend API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      verify: 'GET /api/auth/verify',
      profile: 'GET /api/auth/profile',
      nameService: 'POST /api/auth/riot/name-service',
      userInfoDetailed: 'POST /api/auth/riot/userinfo-detailed'
    }
  });
});

// --- Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Something went wrong!' });
});

// --- Start
async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
    // Load the catalog in the background without blocking server startup
    catalogCache.init().catch(e => console.error('❌ CatalogCache init error:', e));
  } catch (error) {
    console.error('❌ Error starting server:', error);
    process.exit(1);
  }
}

startServer();
