# Plan de paginación, performance y publicaciones escalables

> Documento operativo y fuente de verdad para implementar la carga progresiva de ValoInventory.

## Estado del documento

| Campo | Valor |
|---|---|
| Estado general | `PLANIFICADO — implementación no iniciada` |
| Rama donde se creó el plan | `feat/optimization` |
| Fecha de creación | `2026-08-14` |
| Alcance | Backend, MongoDB, frontend privado, publicaciones públicas y testing |
| Prioridad | Alta |
| Regla principal | Ninguna fase se marca como terminada sin tests y evidencia de performance |

## Plan relacionado y prerrequisito de autenticación

La autenticación MVP se implementará mediante Clerk, Google OAuth y JWT delegado siguiendo [`MVP_AUTH_CLERK_PLAN.md`](./MVP_AUTH_CLERK_PLAN.md).

Relación entre planes:

- Las fases `A01` a `A04` del plan de autenticación deben completarse antes de exponer la nueva API privada de `P05`.
- `A05` debe completarse antes de liberar el MVP a usuarios externos.
- El cutover `A06` puede ejecutarse junto con la transición final `P11`, manteniendo feature flags y rollback independientes.
- Ningún endpoint paginado privado debe confiar en IDs de usuario provenientes del frontend; debe usar la identidad Clerk verificada y comprobar ownership en MongoDB.

## Prioridad de ejecución acordada

Antes de continuar con la arquitectura completa de escalabilidad se priorizan tres entregables:

1. Clerk + Google OAuth + JWT delegado (`MVP_AUTH_CLERK_PLAN.md`).
2. Cierre y hardening de endpoints (`MVP_SECURITY_HARDENING_PLAN.md`).
3. Tokens públicos seguros (`S04` del plan de seguridad).

Docker/hosting final, operación productiva, observabilidad completa y pruebas finales específicas del despliegue quedan para la etapa posterior de deployment. Los tests unitarios, de integración y de seguridad de cada feature siguen siendo obligatorios en su propia rama.

Las decisiones externas de posicionamiento o registro del producto no forman parte de estos planes técnicos por decisión de producto. Esta exclusión no constituye una evaluación jurídica o de cumplimiento.

## Cómo mantener este documento

Este archivo debe actualizarse en cada Pull Request relacionado con el plan.

Convenciones:

- `[ ]` pendiente.
- `[-]` en progreso.
- `[x]` terminado y verificado.
- Cada fase debe registrar rama, commit, PR y evidencia de tests.
- No marcar una fase como terminada si solamente compila.
- Si una decisión arquitectónica cambia, actualizar primero este documento.
- Las ramas propuestas usan el prefijo `codex/`. Se puede cambiar el nombre antes de comenzar, pero debe quedar registrado.

### Condición obligatoria para marcar una fase como terminada

Todas estas casillas deben estar completas:

- [ ] Implementación terminada.
- [ ] Tests unitarios agregados y pasando.
- [ ] Tests de integración agregados y pasando.
- [ ] Tests de regresión pasando.
- [ ] Build de producción pasando.
- [ ] QA funcional documentado.
- [ ] Medición de performance comparada con la línea base.
- [ ] Sin errores nuevos en consola o logs.
- [ ] Documentación y contratos actualizados.
- [ ] Pull Request revisado y mergeado.
- [ ] Rama, commit y PR registrados en el tracker.

## Objetivo

Hacer que ValoInventory se mantenga rápido cuando:

- Un vendedor administra cientos de cuentas.
- Una cuenta contiene cientos o miles de elementos.
- Muchos compradores visitan publicaciones públicas simultáneamente.
- Las APIs externas de Valorant están lentas o temporalmente fuera de servicio.
- El usuario navega entre categorías, busca y ordena repetidamente.

La optimización debe reducir datos transferidos, consultas de MongoDB, trabajo del navegador, cantidad de imágenes cargadas y dependencia directa de servicios externos.

## Objetivos medibles

Los siguientes valores son criterios de aceptación, no estimaciones informales:

| Métrica | Objetivo |
|---|---:|
| Contenido principal visible con API caliente | `< 1 s` en entorno local controlado |
| LCP p75 de una publicación pública | `< 2.5 s` en perfil móvil definido |
| TTFB p95 de endpoints cacheados | `< 300 ms` |
| Resumen de una cuenta | `< 50 KB` comprimido |
| Lote de inventario | `< 250 KB` comprimido, sin imágenes |
| Cantidad predeterminada por lote | `24` |
| Límite máximo permitido por API | `60` |
| Solicitudes externas del navegador para construir un inventario | `0` |
| Duplicados entre páginas | `0` |
| Datos privados expuestos públicamente | `0` |
| Cobertura de lógica crítica de paginación y permisos | `>= 90%` |
| Cobertura global mínima backend/frontend nuevo | `>= 80%` statements, `>= 75%` branches |

Los valores definitivos se confirmarán en la Fase 1 después de medir la aplicación actual.

## Alcance

Incluye:

- Lista privada de cuentas Riot.
- Resumen privado de una cuenta.
- Inventarios privados por categoría.
- Resumen público de una cuenta compartida.
- Inventarios públicos por categoría.
- Publicación general de todas las cuentas seleccionadas de un vendedor.
- Búsqueda, filtros, ordenamiento y carga progresiva.
- Caché de catálogo y respuestas públicas.
- Migración de datos.
- Testing unitario, integración, contrato, E2E, seguridad y performance.
- Observabilidad y estrategia de rollback.

No se pagina:

- Loadout: tiene una cantidad fija y pequeña de armas.
- Resumen de cuenta: debe ser un DTO pequeño con métricas.
- Wallet e identidad.
- Navegación.
- Catálogo completo hacia el navegador: debe dejar de ser necesario en las vistas paginadas.

## Problemas actuales confirmados

1. `GET /api/auth/profile` devuelve el usuario con todas las cuentas y todos sus arrays de inventario.
2. `riotAccounts` está embebido dentro del documento `User`.
3. MongoDB limita cada documento a 16 MB.
4. `SharedView` solicita la cuenta y además varios catálogos externos.
5. El navegador resuelve IDs, nombres, imágenes y precios.
6. Las categorías privadas filtran y ordenan grandes arrays en memoria.
7. El backend no tiene suite de tests: el script actual termina con `Error: no test specified`.
8. El frontend tiene runner de CRA, pero no existe una estrategia común de tests para esta funcionalidad.
9. No existen presupuestos de payload, tiempos de respuesta ni pruebas de carga automatizadas.
10. Los links públicos actuales usan el `puuid`; el modelo ya tiene `shareToken`, pero la ruta no lo aprovecha.

## Decisiones arquitectónicas

### 1. Resumen primero, detalle después

Cada página debe obtener primero un DTO pequeño:

- Identidad pública o privada.
- Totales por categoría.
- Valor estimado.
- Fecha de actualización.
- Categorías disponibles.

Los elementos de inventario se solicitan solamente al abrir una categoría.

### 2. Paginación por cursor

Se usará cursor opaco en lugar de `skip/page` para inventarios y cuentas.

El cursor debe contener una tupla de orden estable:

- Valor y `_id` para orden por precio.
- Nombre normalizado y `_id` para orden alfabético.
- Fecha y `_id` para orden por actualización.

El cliente nunca debe interpretar el contenido del cursor.

### 3. Un contrato estándar

Todos los endpoints paginados deben responder:

```json
{
  "items": [],
  "pageInfo": {
    "nextCursor": "opaque-token-or-null",
    "hasNextPage": false,
    "totalCount": 0,
    "limit": 24
  }
}
```

### 4. Datos enriquecidos por backend

El backend entregará cada elemento con los campos necesarios para renderizarlo:

```json
{
  "id": "inventory-item-id",
  "itemId": "valorant-item-id",
  "category": "skin",
  "displayName": "Prime Vandal",
  "displayIcon": "https://...",
  "price": 1775,
  "weaponId": "...",
  "rarity": "premium"
}
```

El frontend no debe descargar catálogos completos para reconstruir estos datos.

### 5. Tokens públicos aleatorios

Los nuevos links usarán tokens generados con `crypto.randomBytes(32).toString('base64url')`.

- No exponer `puuid` en nuevas URLs.
- Permitir revocar y regenerar el token.
- Mantener compatibilidad temporal con links antiguos.
- Aplicar una lista explícita de campos públicos.

## Modelo de datos objetivo

### `User`

Conserva autenticación y configuración del vendedor:

```js
{
  username,
  email,
  password,
  publicCollectionToken,
  publicCollectionEnabled,
  createdAt
}
```

### `RiotAccount`

Un documento por cuenta:

```js
{
  ownerId,
  puuid,
  name,
  nickname,
  identity,
  loadout,
  wallet,
  userInfo,
  regionInfo,
  lastUpdated,
  inventoryVersion,
  isShared,
  shareToken,
  sharedAt,
  summary: {
    skins,
    buddies,
    battlePasses,
    cards,
    sprays,
    flex,
    titles,
    agents,
    estimatedVP
  }
}
```

### `InventoryItem`

Un documento por elemento normalizado:

```js
{
  accountId,
  category,
  itemId,
  displayName,
  normalizedName,
  displayIcon,
  price,
  rarity,
  weaponId,
  metadata,
  inventoryVersion,
  updatedAt
}
```

### Índices mínimos

```js
// RiotAccount
{ ownerId: 1, lastUpdated: -1, _id: -1 }
{ ownerId: 1, puuid: 1 } // unique
{ shareToken: 1 }        // unique + sparse

// InventoryItem
{ accountId: 1, category: 1, _id: 1 }
{ accountId: 1, category: 1, price: -1, _id: 1 }
{ accountId: 1, category: 1, normalizedName: 1, _id: 1 }
{ accountId: 1, category: 1, weaponId: 1, price: -1, _id: 1 }
```

## API objetivo

### Privada

```text
GET /api/accounts?limit=20&cursor=&search=&sort=updated_desc
GET /api/accounts/:accountId/summary
GET /api/accounts/:accountId/loadout
GET /api/accounts/:accountId/inventory/:category?limit=24&cursor=&search=&sort=&weapon=&rarity=
```

### Pública individual

```text
GET /api/public/accounts/:shareToken
GET /api/public/accounts/:shareToken/inventory/:category?limit=24&cursor=&search=&sort=&weapon=&rarity=
```

### Publicación general del vendedor

```text
POST   /api/share/collection
PUT    /api/share/collection
DELETE /api/share/collection
POST   /api/share/collection/rotate-token

GET /api/public/collections/:collectionToken
GET /api/public/collections/:collectionToken/accounts?limit=20&cursor=&search=&sort=&minValue=&category=
```

## Tamaños iniciales por categoría

| Categoría | Lote inicial | Lotes siguientes | Orden predeterminado |
|---|---:|---:|---|
| Cuentas | 20 | 20 | Última actualización descendente |
| Skins | 24 | 24 | Valor descendente, nombre, ID |
| Cards | 24 | 24 | Nombre ascendente, ID |
| Buddies | 32 | 32 | Nombre ascendente, ID |
| Sprays | 32 | 32 | Nombre ascendente, ID |
| Agents | 24 | 24 | Nombre ascendente, ID |
| Titles | 50 | 50 | Nombre ascendente, ID |
| Battlepasses | 30 | 30 | Fecha o nombre descendente, ID |
| Flex | 30 | 30 | Nombre ascendente, ID |

Los valores deben poder cambiarse desde constantes del backend, no quedar repetidos en cada controlador.

## Tracker general

| ID | Fase | Estado | Rama propuesta | Rama final | Commit/PR | Tests/evidencia |
|---|---|---|---|---|---|---|
| P00 | Documento operativo | ✅ Terminado | `feat/optimization` | `feat/optimization` | Pendiente de commit | Este archivo |
| AUTH | Autenticación MVP y seguridad | ⬜ Pendiente | Ver `MVP_AUTH_CLERK_PLAN.md` | — | — | Prerrequisito de P05 |
| SEC | Hardening API y tokens públicos | ⬜ Pendiente | Ver `MVP_SECURITY_HARDENING_PLAN.md` | — | — | Prerrequisito de P06/P08 |
| P01 | Línea base e infraestructura de testing | ⬜ Pendiente | `codex/perf-01-test-foundation` | — | — | — |
| P02 | Contratos API, DTOs y cursores | ⬜ Pendiente | `codex/perf-02-api-contracts` | — | — | — |
| P03 | Nuevo modelo y migración de datos | ⬜ Pendiente | `codex/perf-03-data-model` | — | — | — |
| P04 | Catálogo indexado y enriquecimiento | ⬜ Pendiente | `codex/perf-04-catalog-indexes` | — | — | — |
| P05 | API privada paginada | ⬜ Pendiente | `codex/perf-05-private-api` | — | — | — |
| P06 | API pública y tokens seguros | ⬜ Pendiente | `codex/perf-06-public-api` | — | — | — |
| P07 | Infraestructura frontend de paginación | ⬜ Pendiente | `codex/perf-07-frontend-pagination` | — | — | — |
| P08 | Vista compartida progresiva | ⬜ Pendiente | `codex/perf-08-shared-view` | — | — | — |
| P09 | Inventarios privados progresivos | ⬜ Pendiente | `codex/perf-09-private-inventory` | — | — | — |
| P10 | Catálogo público del vendedor | ⬜ Pendiente | `codex/perf-10-seller-storefront` | — | — | — |
| P11 | Cutover, observabilidad y limpieza | ⬜ Pendiente | `codex/perf-11-cutover` | — | — | — |

---

# Fases de implementación

## P01 — Línea base e infraestructura de testing

**Rama propuesta:** `codex/perf-01-test-foundation`

### Objetivo

Crear una red de seguridad antes de modificar modelo, endpoints o frontend.

### Backend

- [ ] Instalar y configurar Jest.
- [ ] Instalar Supertest para endpoints Express.
- [ ] Configurar una base de datos Mongo aislada para tests.
- [ ] Separar la creación de `app` del `listen()` para importar Express en tests.
- [ ] Agregar scripts `test`, `test:watch`, `test:coverage` y `test:integration`.
- [ ] Crear factories de User, RiotAccount e inventarios.
- [ ] Crear helpers para emitir JWT de testing.
- [ ] Garantizar limpieza entre tests.
- [ ] Bloquear por test cualquier conexión accidental a Mongo de desarrollo o producción.

### Frontend

- [ ] Instalar/configurar Testing Library, `jest-dom` y `user-event` si faltan.
- [ ] Incorporar MSW para mockear endpoints.
- [ ] Crear helpers de render con Router y Providers.
- [ ] Agregar scripts para unitarios y coverage sin modo watch.
- [ ] Fijar timezone y locale en tests con fechas.

### E2E y performance

- [ ] Incorporar Playwright.
- [ ] Crear proyecto Chromium desktop y viewport móvil.
- [ ] Crear datos de prueba deterministas.
- [ ] Incorporar `autocannon` o k6 para smoke tests de carga.
- [ ] Crear carpeta `tests/performance/` y guardar escenarios versionados.

### Línea base

- [ ] Medir tamaño comprimido y sin comprimir de `/api/auth/profile`.
- [ ] Medir `/api/catalog`.
- [ ] Medir `/api/auth/public/account/:puuid`.
- [ ] Medir cantidad de requests de `SharedView`.
- [ ] Medir TTFB, FCP y LCP con datos pequeños y grandes.
- [ ] Guardar resultados en `docs/performance/baseline.md`.

### Tests obligatorios

- [ ] Registro/login/profile actual.
- [ ] Activar y revocar share actual.
- [ ] Cargar `SharedView` válida.
- [ ] Link inválido y revocado.
- [ ] Build frontend.
- [ ] Smoke test backend.

### Salida

- [ ] CI puede ejecutar todas las suites.
- [ ] Existe un baseline reproducible.
- [ ] Ninguna fase siguiente puede mergearse si estos tests fallan.

## P02 — Contratos API, DTOs y cursores

**Rama propuesta:** `codex/perf-02-api-contracts`

### Objetivo

Definir contratos compartidos antes de cambiar almacenamiento.

### Implementación

- [ ] Crear constantes de categorías y límites.
- [ ] Crear validador común para `limit`, `cursor`, `sort`, `search` y filtros.
- [ ] Crear codificador/decodificador de cursor opaco.
- [ ] Firmar o validar la estructura del cursor para evitar manipulación.
- [ ] Crear formato común de `pageInfo`.
- [ ] Crear DTO privado de resumen.
- [ ] Crear DTO público mediante allowlist.
- [ ] Definir errores 400, 401, 403, 404 y 410.
- [ ] Documentar contratos con ejemplos reales.

### Tests obligatorios

- [ ] Cursor encode/decode.
- [ ] Cursor corrupto o de otra categoría.
- [ ] Límites 0, negativos, superiores al máximo y no numéricos.
- [ ] Ordenamientos no permitidos.
- [ ] Normalización de búsquedas.
- [ ] DTO público no contiene `puuid`, tokens, email ni datos sensibles.
- [ ] Snapshot/contract tests de todas las respuestas.

### Salida

- [ ] Contratos aprobados antes de implementar queries.
- [ ] OpenAPI o documentación equivalente actualizada.

## P03 — Nuevo modelo y migración de datos

**Rama propuesta:** `codex/perf-03-data-model`

### Objetivo

Evitar documentos User crecientes y habilitar consultas paginadas reales.

### Implementación

- [ ] Crear modelo `RiotAccount`.
- [ ] Crear modelo `InventoryItem`.
- [ ] Crear índices y comprobarlos en startup/migración.
- [ ] Crear cálculo determinista de summary.
- [ ] Crear script idempotente de migración.
- [ ] Soportar dry-run.
- [ ] Soportar reanudación después de error.
- [ ] Registrar cuentas migradas, omitidas y fallidas.
- [ ] Mantener los datos embebidos durante el período de compatibilidad.
- [ ] Implementar dual-read temporal con feature flag.
- [ ] No hacer dual-write permanente: definir fecha de corte.

### Verificación de migración

- [ ] Cantidades por categoría coinciden.
- [ ] Valor estimado coincide.
- [ ] Loadout, wallet e identidad coinciden.
- [ ] Shares activas conservan su estado.
- [ ] No hay `InventoryItem` duplicados.
- [ ] Reejecutar migración no duplica datos.

### Tests obligatorios

- [ ] Usuario sin cuentas.
- [ ] Usuario con una cuenta vacía.
- [ ] Usuario con 100 cuentas.
- [ ] Cuenta con 1.000 elementos.
- [ ] Datos parciales o campos faltantes.
- [ ] Migración interrumpida y reanudada.
- [ ] Rollback lógico hacia lectura embebida.

### Salida

- [ ] Reporte de migración agregado al PR.
- [ ] Backup y rollback documentados.

## P04 — Catálogo indexado y enriquecimiento

**Rama propuesta:** `codex/perf-04-catalog-indexes`

### Objetivo

Resolver nombres, imágenes y precios en backend sin enviar catálogos completos al navegador.

### Implementación

- [ ] Crear mapas en memoria por UUID y nombre normalizado.
- [ ] Evitar `.find()` repetidos sobre arrays completos.
- [ ] Mantener último catálogo válido si refresh falla.
- [ ] Agregar versión y timestamp del catálogo.
- [ ] Crear función pura `enrichInventoryItem`.
- [ ] Enriquecer datos al refrescar una cuenta.
- [ ] Definir fallback cuando un item no existe en catálogo.
- [ ] Evitar que la API externa bloquee lecturas existentes.
- [ ] Eliminar dependencias directas del navegador una vez migradas las pantallas.

### Tests obligatorios

- [ ] Lookup por UUID.
- [ ] Lookup por nombre y casing.
- [ ] Skin sin precio.
- [ ] Imagen ausente.
- [ ] Catálogo externo caído.
- [ ] Refresh parcial fallido conserva caché anterior.
- [ ] Benchmark del lookup anterior versus mapas.

## P05 — API privada paginada

**Rama propuesta:** `codex/perf-05-private-api`

### Implementación

- [ ] `GET /api/accounts` con summaries.
- [ ] Búsqueda por nombre y Riot ID.
- [ ] Orden por fecha, valor y nombre.
- [ ] `GET /api/accounts/:id/summary`.
- [ ] `GET /api/accounts/:id/loadout`.
- [ ] `GET /api/accounts/:id/inventory/:category`.
- [ ] Filtros por arma y rareza donde corresponda.
- [ ] Verificar ownership en cada ruta.
- [ ] Agregar `AbortSignal`/timeout a operaciones externas relacionadas.
- [ ] Aplicar `Cache-Control: private` cuando corresponda.

### Tests obligatorios

- [ ] Primera, intermedia y última página.
- [ ] Cero resultados.
- [ ] Exactamente `limit` resultados.
- [ ] Un elemento más que `limit`.
- [ ] Sin duplicados entre cursores.
- [ ] Orden estable con valores repetidos.
- [ ] Búsqueda + filtro + paginación combinados.
- [ ] Acceso a cuenta ajena responde 404/403 según contrato.
- [ ] Performance con 100 cuentas y 1.000 items.

## P06 — API pública y tokens seguros

**Rama propuesta:** `codex/perf-06-public-api`

### Implementación

- [ ] Generar `shareToken` aleatorio por cuenta.
- [ ] Resolver publicación por token, no por `puuid`.
- [ ] Endpoint de resumen público.
- [ ] Endpoint público por categoría.
- [ ] Rotación y revocación de token.
- [ ] Compatibilidad temporal con links antiguos.
- [ ] Rate limiting.
- [ ] ETag basado en `inventoryVersion`.
- [ ] `Cache-Control` público con `stale-while-revalidate`.
- [ ] Allowlist estricta de campos.

### Tests obligatorios

- [ ] Token válido, inválido, revocado y rotado.
- [ ] Link antiguo durante compatibilidad.
- [ ] Nunca se expone `puuid` ni datos privados.
- [ ] Rate limit.
- [ ] ETag devuelve 304.
- [ ] Cache se invalida después de refresh.
- [ ] Dos cuentas no comparten token.

## P07 — Infraestructura frontend de paginación

**Rama propuesta:** `codex/perf-07-frontend-pagination`

### Implementación

- [ ] Incorporar TanStack Query o documentar alternativa equivalente.
- [ ] Crear cliente API tipado/documentado.
- [ ] Crear `usePaginatedCollection`.
- [ ] Crear `PaginatedGrid`.
- [ ] Crear `LoadMoreButton`.
- [ ] Crear skeleton, empty state y error state comunes.
- [ ] Cancelar requests al cambiar filtros/categoría.
- [ ] Debounce de búsqueda de 300 ms.
- [ ] Deduplicar items por ID en cliente como protección secundaria.
- [ ] Mantener datos anteriores durante la siguiente carga.
- [ ] Cachear categorías ya visitadas.
- [ ] Restaurar scroll cuando el usuario vuelve.
- [ ] Añadir retry manual y evitar loops infinitos.

### Tests obligatorios

- [ ] Carga inicial.
- [ ] Cargar más.
- [ ] Fin de resultados.
- [ ] Error inicial y error en página posterior.
- [ ] Retry.
- [ ] Cambio rápido de categorías cancela respuesta anterior.
- [ ] Búsqueda con debounce.
- [ ] No se duplican tarjetas.
- [ ] Navegación con teclado y lector de pantalla.
- [ ] Reduced motion.

## P08 — Vista compartida progresiva

**Rama propuesta:** `codex/perf-08-shared-view`

### Implementación

- [ ] Obtener solamente el resumen al entrar.
- [ ] Mostrar identidad y métricas sin esperar inventarios.
- [ ] Cargar skins como categoría inicial.
- [ ] Solicitar otras categorías al seleccionarlas.
- [ ] Usar paginación estandarizada.
- [ ] Usar `loading="lazy"` y `decoding="async"`.
- [ ] Reservar dimensiones de imagen para evitar CLS.
- [ ] No descargar videos hasta abrir un detalle.
- [ ] Mantener links copiable, revocable y responsive.
- [ ] Eliminar requests externas de catálogo desde `SharedView`.

### Tests obligatorios

- [ ] Resumen aparece antes que items.
- [ ] Sólo se solicita la categoría activa.
- [ ] Categoría visitada se reutiliza desde caché.
- [ ] Link inválido/revocado.
- [ ] Imágenes lentas o rotas.
- [ ] Mobile y desktop E2E.
- [ ] Lighthouse/performance antes y después.
- [ ] Captura de payload y cantidad de requests en el PR.

## P09 — Inventarios privados progresivos

**Rama propuesta:** `codex/perf-09-private-inventory`

### Orden de migración

- [ ] Skins.
- [ ] Cards.
- [ ] Buddies.
- [ ] Sprays.
- [ ] Agents.
- [ ] Titles.
- [ ] Battlepasses.
- [ ] Flex.

Para cada categoría:

- [ ] Usar el endpoint paginado común.
- [ ] Mover búsqueda/filtros/orden al backend.
- [ ] Usar los estados comunes.
- [ ] Agregar tests unitarios y E2E.
- [ ] Comparar cantidad total con la versión anterior.
- [ ] Registrar payload y tiempo.

Loadout y Resumen deben conservar cargas completas pequeñas.

## P10 — Catálogo público del vendedor

**Rama propuesta:** `codex/perf-10-seller-storefront`

### Implementación

- [ ] Crear configuración de publicación general.
- [ ] Elegir todas las cuentas públicas o selección explícita.
- [ ] Generar un único `collectionToken`.
- [ ] Listar cuentas mediante summaries paginados.
- [ ] Buscar por nombre/Riot ID.
- [ ] Ordenar por valor, skins, fecha y nombre.
- [ ] Filtrar por categorías disponibles o valor mínimo.
- [ ] Abrir la publicación individual de cada cuenta.
- [ ] Revocar o rotar el link general.
- [ ] Integrarlo en “Links compartidos”.

### Tests obligatorios

- [ ] Vendedor con 0, 1, 20, 21 y 100 cuentas.
- [ ] Cuenta privada no aparece.
- [ ] Cambiar visibilidad actualiza la colección.
- [ ] Link general se mantiene estable al agregar cuentas.
- [ ] Rotación invalida el link anterior.
- [ ] Búsqueda, orden, filtros y paginación combinados.
- [ ] 100 visitantes concurrentes en prueba de carga.

## P11 — Cutover, observabilidad y limpieza

**Rama propuesta:** `codex/perf-11-cutover`

### Implementación

- [ ] Activar nuevo sistema por feature flag.
- [ ] Comparar resultados nuevos y anteriores en staging/local.
- [ ] Registrar latencia p50, p95 y errores por endpoint.
- [ ] Registrar tamaño de payload.
- [ ] Alertar por respuestas lentas y tasa de error.
- [ ] Confirmar que ninguna vista depende de `/profile` completo.
- [ ] Confirmar que ninguna vista consulta catálogos externos directamente.
- [ ] Retirar arrays embebidos sólo después del período de seguridad.
- [ ] Retirar endpoints antiguos después de la ventana de compatibilidad.
- [ ] Documentar rollback.
- [ ] Actualizar README y AGENTS.md.

### Tests finales

- [ ] Suite completa backend.
- [ ] Suite completa frontend.
- [ ] Suite E2E desktop/móvil.
- [ ] Pruebas de seguridad de endpoints públicos.
- [ ] Prueba de migración sobre copia de datos representativa.
- [ ] Prueba de carga.
- [ ] Build frontend.
- [ ] Arranque limpio con Docker Compose.
- [ ] Smoke manual de login, cuentas, resumen, loadout, inventario y shares.

---

# Estrategia de testing

## Pirámide

### Unitarios

Deben cubrir lógica pura y casos extremos:

- Cursor.
- Validación de query params.
- DTOs.
- Normalización.
- Enriquecimiento de catálogo.
- Cálculo de totales.
- Hooks y reducers de paginación.

### Integración

Deben usar Express + Mongo aislado:

- Autenticación y ownership.
- Queries reales con índices.
- Paginación estable.
- Migración.
- Sharing y revocación.
- Cache headers y ETag.

### Contract tests

Congelan las formas públicas y privadas de respuesta para evitar filtraciones o roturas accidentales.

### E2E

Flujos mínimos:

1. Login → lista de cuentas → cargar más.
2. Abrir cuenta → inventario → cambiar categoría → cargar más.
3. Buscar y filtrar skins.
4. Publicar una cuenta → abrir link público.
5. Publicar catálogo general → buscar cuenta → abrirla.
6. Revocar link → confirmar indisponibilidad.

### Performance

Escenarios versionados:

- 1 cuenta pequeña.
- 100 cuentas por usuario.
- 1.000 items por cuenta.
- 100 visitantes concurrentes.
- Catálogo con caché fría/caliente.
- API externa caída.

## Matriz de navegadores y viewports

| Entorno | Obligatorio |
|---|---|
| Chromium desktop | Sí |
| Chromium móvil | Sí |
| Firefox desktop | Antes de cutover |
| WebKit/Safari | Antes de cutover |
| Reduced motion | Sí |
| Navegación por teclado | Sí |

## Evidencia requerida en cada PR

Copiar y completar:

```text
Rama:
Commit:
PR:

Tests unitarios:
Tests integración:
Tests E2E:
Build:
Coverage:

Payload antes:
Payload después:
TTFB/LCP antes:
TTFB/LCP después:

QA manual:
Riesgos conocidos:
Rollback:
```

## CI requerido

Jobs mínimos:

```text
backend-unit
backend-integration
frontend-unit
frontend-build
e2e-smoke
contract-security
```

Antes de mergear P08, P10 y P11 también debe ejecutarse:

```text
performance-smoke
e2e-full
```

No se permite merge con tests omitidos salvo excepción documentada y aprobada.

# Estrategia de ramas y entregas

- Cada fase comienza desde `main` actualizado.
- Cada rama contiene una fase o un corte vertical pequeño.
- Si una fase supera un tamaño revisable, dividir en subramas y registrarlas.
- No mezclar rediseños visuales no relacionados.
- Cada PR debe incluir migración/rollback cuando toque datos.
- No eliminar compatibilidad antigua en la misma PR que introduce el reemplazo.
- Usar feature flags para cambios de lectura y cutover.
- Hacer commits pequeños con tests junto a la implementación.

## Registro de subramas

Agregar filas cuando una fase se divida:

| Fase | Subrama | Objetivo | Estado | PR | Evidencia |
|---|---|---|---|---|---|
| — | — | — | — | — | — |

# Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Migración pierde o duplica items | Dry-run, idempotencia, conteos y backup |
| Cursor duplica/salta resultados | Orden estable con `_id`, tests concurrentes |
| Catálogo externo cae | Last-known-good cache y datos enriquecidos persistidos |
| Totales no coinciden | Recalcular y comparar antes del cutover |
| Link público filtra datos | DTO allowlist + contract/security tests |
| Muchas imágenes saturan red | Lazy loading, tamaños reservados, lotes pequeños |
| Cambios grandes difíciles de revertir | Feature flags y endpoints paralelos |
| User document se acerca a 16 MB | Migrar cuentas e items a colecciones separadas |
| Búsqueda lenta | Índices normalizados y límites |
| Tests inestables | Datos deterministas, reloj/locale fijos, aislamiento |

# Definición final de terminado

El proyecto completo sólo se marca como terminado cuando:

- [ ] La portada privada descarga únicamente summaries de cuentas.
- [ ] La página compartida descarga resumen + primera categoría.
- [ ] Ninguna respuesta contiene más de 60 items.
- [ ] No hay consultas directas de catálogo desde las vistas migradas.
- [ ] Todas las búsquedas y filtros relevantes se ejecutan en backend.
- [ ] Loadout y Resumen continúan funcionando sin paginación innecesaria.
- [ ] Existe un link único para publicar múltiples cuentas.
- [ ] Los links públicos usan tokens aleatorios y revocables.
- [ ] Las métricas cumplen los presupuestos definidos.
- [ ] Todas las suites pasan en CI.
- [ ] La cobertura mínima se cumple.
- [ ] La migración fue probada y es reversible.
- [ ] La documentación refleja el sistema final.
- [ ] El tracker contiene ramas, commits, PRs y evidencia.
