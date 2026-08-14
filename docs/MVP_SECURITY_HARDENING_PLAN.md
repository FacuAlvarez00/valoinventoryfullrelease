# Plan MVP de hardening de API y tokens públicos

> Plan operativo para cerrar la superficie de ataque actual y reemplazar los links públicos basados en `puuid` por tokens seguros.

## Estado

| Campo | Valor |
|---|---|
| Estado general | `PLANIFICADO — implementación no iniciada` |
| Rama donde se creó | `feat/optimization` |
| Fecha | `2026-08-14` |
| Prioridad | Crítica para el MVP |
| Dependencia | `MVP_AUTH_CLERK_PLAN.md` para identidad privada |
| Regla | Ningún endpoint sensible queda público por conveniencia |

## Alcance activo

- Inventariar y clasificar todos los endpoints.
- Proteger endpoints Riot y mutaciones.
- Aplicar validación, límites, rate limiting y headers seguros.
- Reducir exposición de errores y logs.
- Introducir tokens públicos aleatorios, revocables y rotables.
- Reemplazar gradualmente URLs públicas basadas en `puuid`.
- Crear tests unitarios, integración, contrato y seguridad.

## Fuera de esta etapa

- Hosting final y Docker de producción.
- Backups/restore de la infraestructura productiva.
- Observabilidad productiva completa.
- Pruebas de carga finales del despliegue.
- Lanzamiento beta/público.
- API keys para clientes.
- Organizaciones o roles complejos.

## Relación con autenticación

Orden recomendado:

```text
A01 testing/threat model
        ↓
A02-A03 Clerk frontend + JWT Express
        ↓
S01-S03 cierre y validación de endpoints
        ↓
S04 tokens públicos seguros
        ↓
A04-A05 migración + Google OAuth
        ↓
regresión completa del MVP
```

Las ramas pueden avanzar en paralelo solamente cuando los contratos de identidad y errores ya estén definidos.

## Tracker

| ID | Fase | Estado | Rama propuesta | Rama final | Commit/PR | Evidencia |
|---|---|---|---|---|---|---|
| S00 | Documento operativo | ✅ Terminado | `feat/optimization` | `feat/optimization` | Pendiente | Este archivo |
| S01 | Inventario y contratos de seguridad | ⬜ Pendiente | `codex/security-01-surface-contracts` | — | — | — |
| S02 | Baseline de Express | ⬜ Pendiente | `codex/security-02-express-baseline` | — | — | — |
| S03 | Protección de endpoints Riot | ⬜ Pendiente | `codex/security-03-riot-endpoints` | — | — | — |
| S04 | Tokens públicos seguros | ⬜ Pendiente | `codex/security-04-public-tokens` | — | — | — |
| S05 | Regresión, secret scan y cierre | ⬜ Pendiente | `codex/security-05-regression` | — | — | — |

## Condición para marcar una fase como terminada

- [ ] Implementación terminada.
- [ ] Tests unitarios pasando.
- [ ] Tests de integración pasando.
- [ ] Contract/security tests pasando.
- [ ] Build frontend cuando corresponda.
- [ ] No se agregaron secretos o tokens a Git.
- [ ] No se imprimen credenciales en logs.
- [ ] QA manual documentado.
- [ ] Rollback documentado.
- [ ] Rama, commit y PR registrados.

---

# S01 — Inventario y contratos de seguridad

**Rama propuesta:** `codex/security-01-surface-contracts`

## Objetivo

Clasificar explícitamente cada ruta antes de aplicar middleware global o cambiar respuestas.

## Clasificación requerida

Cada endpoint debe figurar en una matriz con:

```text
método
ruta
público/privado
identidad requerida
ownership requerido
datos sensibles recibidos
rate limit
validación
respuesta pública/privada
tests
```

## Categorías

### Público anónimo

Sólo:

- Healthcheck mínimo.
- Registro/login mientras exista auth legacy.
- Callbacks/webhooks verificados.
- Resúmenes compartidos por token.
- Inventarios compartidos por token y paginados.

### Autenticado

- Perfil.
- Lista de cuentas Riot.
- Resúmenes e inventarios privados.
- Creación y actualización de cuentas.
- Activación, rotación y revocación de shares.

### Interno/no disponible en producción

- Rutas `test-*`.
- Diagnósticos de integraciones.
- Seed y utilidades de desarrollo.
- Refresh manual de catálogos administrativos.

## Contratos de error

```text
400 invalid_request
401 unauthenticated
403 forbidden
404 not_found
409 conflict
410 share_revoked
422 validation_error
429 rate_limited
500 internal_error
502 upstream_error
503 temporarily_unavailable
```

El cuerpo no debe exponer stack, nombres internos de colección, tokens ni respuestas crudas de Riot.

## Tests obligatorios

- [ ] Existe un test/fixture por endpoint registrado.
- [ ] Rutas no registradas fallan en CI o revisión automatizada.
- [ ] Cada ruta sensible rechaza usuario anónimo.
- [ ] Cada ruta con ownership rechaza otro usuario.
- [ ] Ninguna respuesta de error contiene secretos.
- [ ] Endpoints de prueba no existen en modo producción.

# S02 — Baseline seguro de Express

**Rama propuesta:** `codex/security-02-express-baseline`

## Middleware mínimo

- [ ] `helmet` con configuración compatible con frontend/Clerk.
- [ ] CORS mediante allowlist de orígenes.
- [ ] Rechazar startup de producción si `FRONTEND_ORIGIN` está vacío o es `*`.
- [ ] `express.json({ limit: '100kb' })` o límite documentado por ruta.
- [ ] Límite equivalente para urlencoded.
- [ ] `compression` para JSON cuando sea útil.
- [ ] Request ID.
- [ ] Sanitización de logs.
- [ ] Error handler central con códigos estables.
- [ ] Trust proxy configurado sólo según plataforma de despliegue.

## Rate limiting por capa

Valores iniciales sujetos a medición:

| Grupo | Límite inicial |
|---|---:|
| Login/registro | 10 intentos / 15 min / IP |
| Vincular o refrescar Riot | 10 / hora / usuario |
| Mutaciones de share | 30 / hora / usuario |
| Lectura pública summary | 120 / min / IP |
| Lectura pública inventario | 180 / min / IP |
| API privada de lectura | 300 / min / usuario |

Requisitos:

- [ ] Respuesta 429 consistente.
- [ ] `Retry-After` presente.
- [ ] No usar solamente IP para usuarios autenticados.
- [ ] Preparar store compartido antes de escalar a múltiples instancias.
- [ ] No confiar ciegamente en `X-Forwarded-For`.

## Secretos

- [ ] El backend falla al iniciar en producción si falta un secreto obligatorio.
- [ ] Eliminar fallback `supersecretjwt`.
- [ ] Separar configuración dev/test/prod.
- [ ] `.env` permanece ignorado.
- [ ] `.env.example` no contiene valores reales.
- [ ] Secret scan en CI.

## Tests obligatorios

- [ ] CORS permitido y denegado.
- [ ] Body por encima del límite.
- [ ] Headers de seguridad.
- [ ] Rate limit y `Retry-After`.
- [ ] Error handler no filtra stack en producción.
- [ ] Startup falla con configuración insegura.

# S03 — Protección de endpoints Riot

**Rama propuesta:** `codex/security-03-riot-endpoints`

## Objetivo

Evitar que el backend funcione como proxy anónimo hacia Riot o acepte tokens sensibles sin identidad y límites.

## Trabajo

- [ ] Proteger `/riot/skins`.
- [ ] Proteger `/riot/skins/details` o reemplazarlo por catálogo backend.
- [ ] Proteger `/riot/loadout`.
- [ ] Proteger `/riot/sprays/details`.
- [ ] Proteger `/riot/titles/details`.
- [ ] Proteger `/riot/name-service`.
- [ ] Proteger `/riot/userinfo-detailed`.
- [ ] Eliminar/deshabilitar `/riot/test-*` en producción.
- [ ] Aplicar ownership cuando una operación recibe `puuid` o `accountId`.
- [ ] Aplicar timeout y abort a llamadas externas.
- [ ] Mapear errores externos a respuestas propias.
- [ ] Evitar reintentos automáticos sobre errores no recuperables.
- [ ] No guardar ni imprimir tokens Riot.
- [ ] Redactar Authorization, entitlement token y cookies en logs.

## Validación

- [ ] Schemas explícitos por body, params y query.
- [ ] Rechazar campos desconocidos en operaciones sensibles.
- [ ] Límites de longitud para tokens, nombres y IDs.
- [ ] UUID/ID con formato validado.
- [ ] No construir URLs externas con valores sin validar.

## Tests obligatorios

- [ ] Anónimo recibe 401.
- [ ] Usuario A no consulta/refresca cuenta de B.
- [ ] Body incompleto o con tipo incorrecto.
- [ ] Token demasiado largo.
- [ ] Timeout externo.
- [ ] Riot responde 401, 403, 429 y 5xx.
- [ ] Respuesta/log no contiene token recibido.
- [ ] Endpoint test no está disponible en producción.

# S04 — Tokens públicos seguros

**Rama propuesta:** `codex/security-04-public-tokens`

## Objetivo

Reemplazar links `/share/:puuid` por identificadores aleatorios, rotables y revocables.

## Diseño

Generación:

```js
const rawToken = crypto.randomBytes(32).toString('base64url');
const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
```

Persistencia recomendada:

```js
{
  shareTokenHash,
  shareTokenPrefix,
  isShared,
  sharedAt,
  shareRevokedAt,
  shareVersion
}
```

Reglas:

- Guardar hash, no el token completo.
- Mostrar/copiar el token completo sólo al crearlo o rotarlo.
- Usar al menos 256 bits de entropía.
- No reutilizar tokens revocados.
- Rotar invalida inmediatamente el anterior.
- Revocar no borra auditoría.
- Nunca usar `puuid`, email, username o IDs incrementales como token.
- No incluir datos sensibles en respuesta pública.

## Endpoints

```text
POST   /api/share/accounts/:accountId
POST   /api/share/accounts/:accountId/rotate
DELETE /api/share/accounts/:accountId

GET /api/public/accounts/:shareToken
GET /api/public/accounts/:shareToken/inventory/:category
```

## DTO público allowlist

Permitido según vista:

- Nombre público.
- Riot ID visible si el propietario lo habilita.
- Totales por categoría.
- Valor estimado.
- Items de categoría paginados.
- Fecha de actualización.

Prohibido:

- `puuid`.
- Email.
- Clerk user ID.
- Mongo IDs internos cuando no sean necesarios.
- JWT.
- Tokens Riot.
- Wallet u otros campos sensibles no aprobados.
- Datos completos de User.

## Compatibilidad

- [ ] Definir ventana temporal para links `/share/:puuid` existentes.
- [ ] Feature flag para resolver links legacy.
- [ ] Permitir al propietario generar el nuevo link.
- [ ] Mostrar aviso de migración al propietario, no al visitante.
- [ ] Desactivar ruta legacy al finalizar la ventana.
- [ ] No crear nuevos links legacy desde el frontend.

## Tests obligatorios

- [ ] Token tiene entropía/formato esperado.
- [ ] Base almacena hash, no token crudo.
- [ ] Token válido muestra sólo allowlist.
- [ ] Token inválido no revela si existe una cuenta.
- [ ] Token revocado devuelve 410/404 según contrato.
- [ ] Token rotado invalida el anterior.
- [ ] Dos cuentas nunca comparten token.
- [ ] Requests concurrentes de creación no generan estados inconsistentes.
- [ ] Usuario no rota/revoca share ajeno.
- [ ] Rate limiting público.
- [ ] Contract test impide exposición de `puuid` y secretos.

# S05 — Regresión, secret scan y cierre

**Rama propuesta:** `codex/security-05-regression`

## Checklist

- [ ] Suite auth Clerk completa.
- [ ] Suite de endpoints completa.
- [ ] Suite de sharing completa.
- [ ] Secret scan del historial nuevo y working tree.
- [ ] Dependency audit revisado.
- [ ] Logs inspeccionados con requests reales.
- [ ] CORS y rate limits probados.
- [ ] Frontend actualizado a nuevas rutas.
- [ ] Build frontend.
- [ ] Smoke local con Docker Compose.
- [ ] Planes y README actualizados.
- [ ] Rollback probado mediante feature flags.

## Criterio final de terminado

- [ ] No quedan proxies Riot anónimos.
- [ ] No quedan endpoints test activos en producción.
- [ ] Todas las mutaciones requieren identidad y ownership.
- [ ] Express rechaza configuración insegura en producción.
- [ ] Los links nuevos no exponen `puuid`.
- [ ] Los tokens públicos se almacenan hasheados.
- [ ] Rotación y revocación están testeadas.
- [ ] No hay secretos en bundle, logs o Git.
- [ ] Todos los tests obligatorios pasan.

## Evidencia por PR

```text
Rama:
Commit:
PR:

Endpoints modificados:
Tests unitarios:
Tests integración:
Tests seguridad/contrato:
Build:

Secret scan:
Logs inspeccionados:
QA manual:
Riesgos:
Rollback:
```

