# ValoInventory — Full Release

Inventario de skins de Valorant. Fork de uso interno para llevar el frontend a un estilo más
tipo Explorant/Valobox. Backend en Node/Express + MongoDB, frontend en React (CRA).

## Requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (incluye Docker Compose)

No hace falta tener Node ni Mongo instalados localmente — todo corre en contenedores.

## Levantar el proyecto

```bash
git clone https://github.com/FacuAlvarez00/valoinventoryfullrelease.git
cd valoinventoryfullrelease

cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

docker compose up --build
```

Esto levanta tres servicios:

| Servicio  | URL                      | Descripción                         |
|-----------|--------------------------|--------------------------------------|
| frontend  | http://localhost:3000    | React (CRA dev server, hot reload)  |
| backend   | http://localhost:4000    | API Express (nodemon, hot reload)   |
| mongo     | localhost:27017          | MongoDB local (datos en volumen)    |

El código de `backend/` y `frontend/` está montado como volumen dentro de los contenedores,
así que cualquier cambio que hagas en el editor se refleja al instante (hot reload), sin
necesidad de rebuildear la imagen. Solo hace falta `--build` de nuevo si cambiás
`package.json` (dependencias nuevas).

Para parar todo: `Ctrl+C` o `docker compose down`. Para borrar también los datos de Mongo:
`docker compose down -v`.

## Variables de entorno

### `backend/.env`

Ya viene con un `.env.example` con defaults razonables para desarrollo local (Mongo apunta
al contenedor `mongo` del docker-compose, JWT secret de dev, etc). No hace falta tocarlo para
levantar el proyecto. Las únicas que podrías querer completar:

- `HENRIKDEV_API_KEY`: key de [HenrikDev API](https://docs.henrikdev.xyz) para el lookup de
  nivel de cuenta. Sin ella, ese endpoint puntual no funciona, pero el resto de la app sí.

### `frontend/.env`

- `REACT_APP_API_BASE_URL`: por defecto apunta a `http://localhost:4000` (el backend
  dockerizado). Si corrés el backend en otro puerto/host, actualizalo acá.

**Nota:** `.env` está en `.gitignore` en ambas carpetas — nunca se commitea. Si agregás una
variable nueva, actualizá también el `.env.example` correspondiente para que el resto del
equipo sepa que existe.

## Estructura

```
.
├── backend/        # API Express + Mongoose
├── frontend/        # React (Create React App)
└── docker-compose.yml
```

Ver [backend/README.md](backend/README.md) para el detalle de la estructura del backend
(controllers, routes, servicios).

## Desarrollo sin Docker (opcional)

Si preferís correr todo nativo:

```bash
# Backend
cd backend
npm install
npm run dev          # nodemon, puerto 4000 — necesita un Mongo accesible vía MONGODB_URI

# Frontend (en otra terminal)
cd frontend
npm install
npm start             # CRA dev server, puerto 3000
```

En este caso necesitás tu propia instancia de MongoDB (local o Atlas) y setear
`MONGODB_URI` en `backend/.env` manualmente.
