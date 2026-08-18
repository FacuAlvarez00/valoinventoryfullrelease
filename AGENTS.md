# ValoInventory Repo Context

Este archivo es contexto corto para IA/agentes. Usalo antes de explorar carpetas completas.

## Que es la aplicacion

ValoInventory es una app web para consultar y mostrar inventario de Valorant: skins, buddies, cards, sprays, titles, agents, flex items y loadout. El frontend permite login/registro, vincular cuenta Riot, ver colecciones propias, navegar catalogos de Valorant y compartir una vista publica por token.

Arquitectura general:

- `frontend/`: React app orientada a UI e inventario.
- `backend/`: API Node/Express con MongoDB, auth JWT, integraciones Riot/Valorant y endpoints de inventario.
- `weaponSkins.json`: data estatica de skins en la raiz.
- `docker-compose.yml`: levanta frontend, backend y mongo para desarrollo local.

## Comandos principales

Desde la raiz:

- `docker compose up --build`: entorno completo.

Frontend:

- `cd frontend && npm install`
- `npm run dev` o `npm start`: React dev server.
- `npm run build`: build de produccion.
- `npm test`: test runner de React.

Backend:

- `cd backend && npm install`
- `npm run dev`: API con nodemon.
- `npm start`: API con Node.

## Frontend

Stack detectado:

- React.
- React Router.
- CRA/react-scripts para scripts.
- Tambien hay dependencia de Vite/plugin React, pero los scripts actuales usan `react-scripts`.
- Librerias UI/UX: `framer-motion`, `swiper`, `dayjs`.

Directorios relevantes:

- `frontend/src/App.js`: composicion principal de providers, router, carga inicial de data Valorant y rutas.
- `frontend/src/index.js`: entrypoint de React.
- `frontend/src/index.css`: estilos globales.
- `frontend/src/context/`: estado global.
- `frontend/src/components/auth/`: login, registro y pantalla auth.
- `frontend/src/components/ui/`: landing/home, layout, loading, notificaciones, idioma, player card.
- `frontend/src/components/weapons/`: galeria y detalle de armas/skins.
- `frontend/src/components/inventory/`: inventario por categorias, dashboard, skins propias, vista compartida.
- `frontend/src/hooks/`: hooks reutilizables.
- `frontend/src/data/`: data auxiliar del frontend.

Contextos:

- `AuthContext.jsx`: login, register, profile, token y sesion. Usa `REACT_APP_API_BASE_URL` o fallback `https://valoinventory-1.onrender.com`.
- `InventoryContext.jsx`: perfil e inventario/catalogo compartido para vistas de inventario.
- `LanguageContext.jsx`: textos e idioma UI.

Hooks:

- `useNotification.js`: estado de notificaciones.
- `useStaticAgents.js`: obtiene agentes estaticos desde `valorant-api.com`.

Rutas principales en `frontend/src/App.js`:

- `/`: renderiza el flujo principal (`AppContent`), con landing/auth/home segun sesion.
- `/mis-skins`: skins propias.
- `/inventory`: dashboard de inventario.
- `/inventory/skins`
- `/inventory/battlepass`
- `/inventory/buddies`
- `/inventory/cards`
- `/inventory/sprays`
- `/inventory/flex`
- `/inventory/titles`
- `/inventory/agents`
- `/details`
- `/share/:token`: vista publica compartida.

APIs usadas por el frontend:

- Backend propio: `REACT_APP_API_BASE_URL` o `https://valoinventory-1.onrender.com`.
- Endpoints frecuentes: `/api/auth/login`, `/api/auth/register`, `/api/auth/profile`, `/api/auth/riot/account`, `/api/auth/riot/skins`, `/api/auth/riot/skins/details`, `/api/auth/riot/loadout`, `/api/auth/share/:puuid`, `/api/auth/public/account/:token`.
- APIs externas: `https://valorant-api.com/v1/...` para weapons, skins, chromas, levels, agents, contracts, flex, playercards y titles.
- API externa adicional: `https://vinfo-api.com/json/weaponSkins`.

## Backend

Stack detectado:

- Express.
- MongoDB/Mongoose.
- JWT con `jsonwebtoken`.
- `bcryptjs` para passwords.
- `cors`, `dotenv`, `nodemailer`, `node-fetch`, `fetch-cookie`, `tough-cookie`.

Archivos clave:

- `backend/server.js`: configura Express, CORS, body parsers y monta `/api/auth`.
- `backend/database.js`: conexion Mongo (`MONGODB_URI` o `MONGO_URI`).
- `backend/routes/auth.js`: rutas auth, Riot, inventario y sharing.
- `backend/controllers/authController.js`: auth.
- `backend/controllers/riotController.js`: integracion Riot.
- `backend/services/riotService.js`: llamadas/flujo Riot.
- `backend/services/catalogCache.js`: cache de catalogo.
- `backend/models/User.js`: modelo principal de usuario.
- `backend/config/constants.js`: constantes, incluyendo `JWT_SECRET`.

Variables de entorno vistas:

- Backend: `PORT`, `FRONTEND_ORIGIN`, `MONGODB_URI`, `MONGO_URI`, `JWT_SECRET`.
- Frontend: `REACT_APP_API_BASE_URL`.

## Guia para futuras IAs

- No empieces leyendo todo el repo. Primero revisa este archivo y luego abre solo los archivos de la zona afectada.
- Para referencias visuales, revisar `docs/README.md` antes de abrir `docs/`; esa carpeta contiene snippets externos e inspiracion UI, no codigo productivo.
- Para cambios de UI/rutas, casi siempre empezar por `frontend/src/App.js` y el componente en `frontend/src/components/...`.
- Para estado de usuario o inventario, revisar `frontend/src/context/AuthContext.jsx` e `InventoryContext.jsx`.
- Para endpoints, revisar primero `backend/routes/auth.js`; luego controllers/services segun la ruta.
- Evitar refactors amplios: el frontend esta organizado por feature en carpetas de componentes y usa exports por `index.js`.
- Si se toca API base URL, mantener compatibilidad con `REACT_APP_API_BASE_URL`.
- Si se agrega una nueva vista de inventario, probablemente hay que tocar `App.js`, `InventoryNavbar.jsx`, `frontend/src/components/inventory/index.js` y crear el componente en `components/inventory/`.
