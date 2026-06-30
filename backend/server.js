require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./database');
const authRoutes = require('./routes/auth');
const catalogCache = require('./services/catalogCache');
const fetch = (...args) => import('node-fetch').then(mod => mod.default(...args));

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

// --- Rutas
app.use('/api/auth', authRoutes);

// --- Catálogo cacheado (skins, weapons, chromas, skinlevels, precios)
app.get('/api/catalog', (req, res) => {
  if (!catalogCache.isReady()) {
    return res.status(503).json({ success: false, message: 'Catálogo cargando, reintentá en unos segundos' });
  }
  const { weapons, skins, chromas, skinlevels, weaponSkins, lastUpdated } = catalogCache.get();
  res.json({ success: true, weapons, skins, chromas, skinlevels, weaponSkins, lastUpdated });
});

// --- Healthcheck (útil para Render)
app.get('/health', (req, res) => res.status(200).json({ ok: true }));

// --- Proxy HenrikDev (igual que tenías)
app.get('/api/account-level/:nickname', async (req, res) => {
  try {
    const { nickname } = req.params;
    if (!nickname || !nickname.includes('#')) {
      return res.status(400).json({ error: 'Formato de nickname inválido' });
    }
    const [name, tag] = nickname.split('#');
    const response = await fetch(`https://api.henrikdev.xyz/valorant/v1/account/${name}/${tag}`, {
      headers: { authorization: process.env.HENRIKDEV_API_KEY || '' }
    });
    if (!response.ok) {
      return res.status(response.status).json({ error: 'No se pudo obtener el nivel de cuenta' });
    }
    const data = await response.json();
    return res.json({ account_level: data.data?.account_level || null });
  } catch (err) {
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

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
    // Cargar catálogo en segundo plano (no bloquea el arranque del servidor)
    catalogCache.init().catch(e => console.error('❌ CatalogCache init error:', e));
  } catch (error) {
    console.error('❌ Error starting server:', error);
    process.exit(1);
  }
}

startServer();
